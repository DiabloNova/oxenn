/**
 * Competitive Analysis API authentication regression.
 * Business-flow coverage belongs to the route's unit suite; this standalone
 * smoke test verifies that caller-controlled identity headers are rejected.
 */
import { NextRequest } from "next/server";
import { POST } from "../../../src/app/api/v1/analysis/competitive/route";

export async function testCompetitiveAnalysis() {
  console.log("▶ Running Competitive Analysis authentication regression...");

  const req = new NextRequest("http://localhost/api/v1/analysis/competitive", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": "ws-tehran",
      "x-user-id": "usr-1001",
    },
    body: JSON.stringify({
      userUrl: "https://optimus-ai-brand.ir",
      competitorUrls: ["https://competitor-alpha.com"],
      analysisDepth: "standard",
    }),
  });

  const response = await POST(req);
  const payload = await response.json();

  if (response.status !== 401) {
    throw new Error(`Expected header-only request to return 401, got ${response.status}: ${JSON.stringify(payload)}`);
  }

  console.log("✅ Competitive Analysis rejects caller-supplied identity headers.");
}

if (require.main === module) {
  testCompetitiveAnalysis().catch((error) => {
    console.error("❌ Competitive Analysis authentication regression failed:", error);
    process.exit(1);
  });
}
