import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/v1/analytics/llm/route";
import { NextRequest } from "next/server";

describe("DIRECT REGRESSION TEST: src/app/api/v1/analytics/llm/route.ts", () => {
  it("Test 1: Missing x-tenant-id -> 401 Unauthorized (Authorization Boundary)", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: "Rasha Gostar",
        competitorNames: ["Digikala"],
        queries: ["بهترین برند کدام است؟"],
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("Test 2: Invalid / unparseable LLM output -> Fail Closed HTTP 500 (No Math.random / synthetic fallback)", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "00000000-0000-0000-0000-000000000001",
        "x-user-id": "usr-test-123",
      },
      body: JSON.stringify({
        brandName: "رها گستر",
        competitorNames: ["Digikala"],
        queries: ["بهترین برند کدام است؟"],
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal Server Error");
    expect(body.shareOfVoice).toBeUndefined();
    expect(body.sentimentScore).toBeUndefined();
  });
  it("rejects an observed brand-name warning without a user decision", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "00000000-0000-0000-0000-000000000001",
        "x-user-id": "usr-test-123",
      },
      body: JSON.stringify({
        brandName: "خانهA",
        brandNameWarningObserved: true,
        brandNameWarningDecision: "not-needed",
        competitorNames: ["Digikala"],
        queries: ["بهترین برند کدام است؟"],
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Bad Request");
  });

  it("rejects a flagged current brand name when the client omits warning metadata", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "00000000-0000-0000-0000-000000000001",
        "x-user-id": "usr-test-123",
      },
      body: JSON.stringify({
        brandName: "خانهA",
        competitorNames: ["Digikala"],
        queries: ["بهترین برند کدام است؟"],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("allows a currently flagged name after explicit confirmation past schema validation", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "00000000-0000-0000-0000-000000000001",
        "x-user-id": "usr-test-123",
      },
      body: JSON.stringify({
        brandName: "خانهA",
        brandNameWarningObserved: true,
        brandNameWarningDecision: "confirmed",
        competitorNames: ["Digikala"],
        queries: ["بهترین برند کدام است؟"],
      }),
    });

    const res = await POST(req);
    expect(res.status).not.toBe(400);
  });

  it("allows a corrected Persian name while preserving the earlier warning", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "00000000-0000-0000-0000-000000000001",
        "x-user-id": "usr-test-123",
      },
      body: JSON.stringify({
        brandName: "خانه",
        brandNameWarningObserved: true,
        brandNameWarningDecision: "corrected",
        competitorNames: ["Digikala"],
        queries: ["بهترین برند کدام است؟"],
      }),
    });

    const res = await POST(req);
    expect(res.status).not.toBe(400);
  });

});
