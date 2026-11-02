/**
 * Premium Audit API authentication regression.
 * Requests carrying only caller-controlled identity headers must fail closed.
 */
import { NextRequest } from "next/server";
import { POST } from "../../../src/app/api/v1/audit/premium/route";

export async function testPremiumAudit() {
  console.log("▶ Running Premium SEO Audit authentication regression...");

  const req = new NextRequest("http://localhost/api/v1/audit/premium", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": "org-enterprise-01",
      "x-user-id": "usr-test-101",
    },
    body: JSON.stringify({ url: "https://optimus.ai", depth: 10 }),
  });

  const response = await POST(req);
  const payload = await response.json();

  if (response.status !== 401) {
    throw new Error(`Expected header-only request to return 401, got ${response.status}: ${JSON.stringify(payload)}`);
  }

  console.log("✅ Premium Audit rejects caller-supplied identity headers.");
}

if (require.main === module) {
  testPremiumAudit().catch((error) => {
    console.error("❌ Premium SEO Audit authentication regression failed:", error);
    process.exit(1);
  });
}
