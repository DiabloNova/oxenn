import { NextRequest } from "next/server";
import { POST } from "../../../src/app/api/v1/optimization/technical/route";

export async function testTechnicalOptimizationAuthenticationBoundary() {
  const response = await POST(new NextRequest("http://localhost/api/v1/optimization/technical", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": "attacker-tenant",
      "x-user-id": "attacker-user",
    },
    body: JSON.stringify({ url: "https://example.com" }),
  }));

  if (response.status !== 401) {
    throw new Error("Expected spoofed identity headers to be rejected with 401; received " + response.status + ".");
  }
}

if (require.main === module) {
  testTechnicalOptimizationAuthenticationBoundary().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
