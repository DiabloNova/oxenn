import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { CrawlerOrchestrator } from "@/services/crawler/crawler-orchestrator";
import { AuthorizationError, authorizeApiRequest } from "@/services/auth/authorization";
import { TenantContextManager } from "@/core/database/tenant-context";
import { subscriptionService } from "@/features/billing/services/subscription-service";
import { getCrawlerRedirectPolicy } from "@/services/crawler/redirect-policy";

// Request body validation schema
const requestSchema = z.object({
  seedUrls: z
    .array(
      z.string().max(2048, "Seed URL exceeds the maximum length").url("Each seed URL must be a valid URL")
    )
    .max(50, "At most 50 seed URLs can be submitted")
    .min(1, "At least one seed URL is required"),
});

export async function POST(req: NextRequest) {
  try {
    const { tenantId, userId } = await authorizeApiRequest(req);
    const requestId = req.headers.get("x-request-id") || randomUUID();

    // 3. Parse and validate JSON request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON body structure." },
        { status: 400 }
      );
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad Request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { seedUrls } = parsed.data;

    // 4. Initialize the Crawler Orchestrator and run the campaign
    const redirectPolicy = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        const subscription = await subscriptionService.getEffectiveSubscription();
        return getCrawlerRedirectPolicy(subscription.effectivePlan.id);
      }
    );
    const orchestrator = new CrawlerOrchestrator();
    const result = await orchestrator.runCrawlerCampaign(
      seedUrls,
      tenantId,
      userId,
      requestId,
      redirectPolicy
    );

    // 5. Return success result with status 200 OK
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.statusCode === 401 ? "Unauthorized" : "Forbidden", message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[API Crawler Campaign Start Route Error]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
