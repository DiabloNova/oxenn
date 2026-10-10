import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ObservabilityContextManager } from "@/services/observability/context";
import { ObservabilityTracker } from "@/services/observability/tracker";
import { ObservabilityContext } from "@/services/observability/types";

describe('Observability & Telemetry Integration', () => {
  const originalSampleRate = process.env.OBSERVABILITY_TRACE_SAMPLE_RATE;
  const originalThreshold = process.env.OBSERVABILITY_LLM_TOKEN_WARNING_THRESHOLD;

  beforeEach(() => {
    ObservabilityTracker.clear();
  });

  afterEach(() => {
    if (originalSampleRate !== undefined) {
      process.env.OBSERVABILITY_TRACE_SAMPLE_RATE = originalSampleRate;
    } else {
      delete process.env.OBSERVABILITY_TRACE_SAMPLE_RATE;
    }

    if (originalThreshold !== undefined) {
      process.env.OBSERVABILITY_LLM_TOKEN_WARNING_THRESHOLD = originalThreshold;
    } else {
      delete process.env.OBSERVABILITY_LLM_TOKEN_WARNING_THRESHOLD;
    }
  });

  it('maintains strict AsyncLocalStorage context isolation across concurrent async executions', async () => {
    const contextA: ObservabilityContext = {
      requestId: "req-alice-111",
      traceId: "trace-alice-222",
      tenantId: "ws-alice-tenant",
      operation: "SEO_crawl"
    };

    const contextB: ObservabilityContext = {
      requestId: "req-bob-333",
      traceId: "trace-bob-444",
      tenantId: "ws-bob-tenant",
      operation: "RAG_query"
    };

    const aliceWork = async () => {
      return ObservabilityContextManager.runWithContext(contextA, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const activeCtx = ObservabilityContextManager.get();
        expect(activeCtx?.requestId).toBe("req-alice-111");
        expect(activeCtx?.tenantId).toBe("ws-alice-tenant");
        return "alice-success";
      });
    };

    const bobWork = async () => {
      return ObservabilityContextManager.runWithContext(contextB, async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        const activeCtx = ObservabilityContextManager.get();
        expect(activeCtx?.requestId).toBe("req-bob-333");
        expect(activeCtx?.tenantId).toBe("ws-bob-tenant");
        return "bob-success";
      });
    };

    const [resA, resB] = await Promise.all([aliceWork(), bobWork()]);
    expect(resA).toBe("alice-success");
    expect(resB).toBe("bob-success");
  });

  it('respects probabilistic trace sampling while keeping latency metrics decoupled', () => {
    process.env.OBSERVABILITY_TRACE_SAMPLE_RATE = "0.0";

    ObservabilityTracker.trackEvent({
      name: "crawl.success",
      durationMs: 120,
      metadata: { pages: 5 }
    });

    const events = ObservabilityTracker.getEvents();
    const metrics = ObservabilityTracker.getMetrics();

    expect(events.length).toBe(0);

    const hasLatencyMetric = metrics.some(m => m.name === "crawl.success.latency" && m.value === 120);
    expect(hasLatencyMetric).toBe(true);
  });

  it('bypasses trace sampling and always preserves error events', () => {
    process.env.OBSERVABILITY_TRACE_SAMPLE_RATE = "0.0";

    ObservabilityTracker.trackEvent({
      name: "crawl.failed",
      durationMs: 45,
      error: { code: "CRAWL_TIMEOUT", message: "Target site took too long to respond." }
    });

    const errorEvents = ObservabilityTracker.getEvents();
    expect(errorEvents.length).toBe(1);
    expect(errorEvents[0].error?.code).toBe("CRAWL_TIMEOUT");
  });

  it('triggers high-cost AI token warnings and excludes sensitive prompts/completions', () => {
    process.env.OBSERVABILITY_LLM_TOKEN_WARNING_THRESHOLD = "1000";
    process.env.OBSERVABILITY_TRACE_SAMPLE_RATE = "1.0";

    ObservabilityTracker.trackLlmUsage({
      provider: "google",
      model: "gemini-2.5-flash",
      operation: "brief",
      inputTokens: 300,
      outputTokens: 200
    });

    const normalEvents = ObservabilityTracker.getEvents();
    expect(normalEvents.some(e => e.name === "llm.cost.threshold_exceeded")).toBe(false);

    ObservabilityTracker.clear();
    ObservabilityTracker.trackLlmUsage({
      provider: "google",
      model: "gemini-2.5-flash",
      operation: "audit",
      inputTokens: 800,
      outputTokens: 500
    });

    const warningEvents = ObservabilityTracker.getEvents();
    const warningEvent = warningEvents.find(e => e.name === "llm.cost.threshold_exceeded");
    expect(warningEvent).toBeDefined();

    expect(warningEvent?.metadata?.prompt).toBeUndefined();
    expect(warningEvent?.metadata?.completion).toBeUndefined();
  });
});
