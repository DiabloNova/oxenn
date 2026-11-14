import { inngest } from "./client";
import { cleanupExpiredFreeAuditRateLimits } from "@/services/audit/free-audit-rate-limit-cleanup";
import { getEmailSender } from "@/services/email/adapters";
import {
  assertEmailOutboxEncryptionConfigured,
  claimEmailOutbox,
  decryptEmailOutboxPayload,
  EmailOutboxConfigurationError,
  isEmailOutboxTokenCurrent,
  listDispatchableEmailOutboxIds,
  markEmailOutboxCancelled,
  markEmailOutboxFailed,
  markEmailOutboxSent,
} from "@/services/email/outbox";
import type { EmailOutboxPayload } from "@/services/email/outbox";

export const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "test/hello.world" }] },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { event, body: "Hello, World!" };
  },
);

export const scheduledMonitoring = inngest.createFunction(
  { id: "scheduled-monitoring-placeholder", triggers: [{ cron: "0 * * * *" }] },
  async ({ step }) => {
    await step.run("execute-monitoring", async () => {
      // Placeholder for future Website Monitoring job implementation
      console.log("Running scheduled monitoring placeholder...");
      return { status: "success", timestamp: new Date().toISOString() };
    });
    return { message: "Scheduled monitoring completed" };
  },
);

export const freeAuditRateLimitCleanup = inngest.createFunction(
  { id: "free-audit-rate-limit-cleanup", triggers: [{ cron: "*/15 * * * *" }] },
  async ({ step }) => {
    const deletedRows = await step.run("delete-expired-free-audit-buckets", cleanupExpiredFreeAuditRateLimits);
    return { deletedRows };
  },
);

export const processEmailOutbox = inngest.createFunction(
  { id: "process-email-outbox", retries: 3, triggers: [{ event: "email/outbox.dispatch" }] },
  async ({ event, step }) => {
    const outboxId = event.data?.outboxId;
    if (typeof outboxId !== "string" || !/^[0-9a-f-]{36}$/i.test(outboxId)) {
      return { status: "invalid-event" };
    }
    assertEmailOutboxEncryptionConfigured();
    const record = await step.run("claim-email-outbox", () => claimEmailOutbox(outboxId));
    if (!record) return { status: "not-claimable" };

    let payload: EmailOutboxPayload;
    try {
      payload = decryptEmailOutboxPayload(record.id, record);
    } catch (error) {
      if (error instanceof EmailOutboxConfigurationError) throw error;
      await step.run("fail-invalid-email-outbox-payload", () =>
        markEmailOutboxFailed(record.id, "PAYLOAD_DECRYPTION_FAILED")
      );
      return { status: "failed-invalid-payload" };
    }

    // Revalidate inside the send step, not in a separately checkpointed step:
    // Inngest retries must re-check expiry/consumption/email changes immediately
    // before each provider attempt rather than replaying a stale "valid" result.
    const sendResult = await step.run("send-authentication-email", async () => {
      const tokenIsCurrent = await isEmailOutboxTokenCurrent(record, payload);
      if (!tokenIsCurrent) {
        await markEmailOutboxCancelled(record.id);
        return { delivered: false, cancelled: true };
      }
      const sender = getEmailSender();
      await sender.send({ to: payload.to, templateId: payload.templateId, params: payload.params });
      return { delivered: true, cancelled: false };
    });
    if (sendResult.cancelled) return { status: "cancelled-stale-token" };
    await step.run("mark-email-outbox-sent", () => markEmailOutboxSent(record.id));
    return { status: "sent" };
  },
);

export const recoverEmailOutbox = inngest.createFunction(
  { id: "recover-email-outbox", retries: 2, triggers: [{ cron: "* * * * *" }] },
  async ({ step }) => {
    assertEmailOutboxEncryptionConfigured();
    const outboxIds = await step.run("find-dispatchable-email-outbox-rows", listDispatchableEmailOutboxIds);
    if (outboxIds.length === 0) return { dispatched: 0 };
    const events = outboxIds.map((outboxId) => ({ name: "email/outbox.dispatch", data: { outboxId } }));
    await step.run("dispatch-email-outbox-events", async () => {
      await inngest.send(events);
      return { dispatched: events.length };
    });
    return { dispatched: outboxIds.length };
  },
);
