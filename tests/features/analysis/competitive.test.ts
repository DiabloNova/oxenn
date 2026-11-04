import { NextRequest } from "next/server";
import { POST } from "../../../src/app/api/v1/analysis/competitive/route";

export async function testCompetitiveAnalysisAuthenticationBoundary() {
  const response = await POST(new NextRequest("http://localhost/api/v1/analysis/competitive", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": "attacker-tenant",
      "x-user-id": "attacker-user",
    },
    body: JSON.stringify({
      userUrl: "https://example.com",
      competitorUrls: ["https://competitor.example"],
    }),
  }));

  if (response.status !== 401) {
    throw new Error("Expected spoofed identity headers to be rejected with 401; received " + response.status + ".");
  }
}

if (require.main === module) {
  testCompetitiveAnalysisAuthenticationBoundary().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
