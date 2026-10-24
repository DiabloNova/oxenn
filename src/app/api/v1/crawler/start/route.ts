import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { CrawlerOrchestrator } from "@/services/crawler/crawler-orchestrator";

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
    // 1. Authenticate check: Extract tenant ID from request headers
    const tenantId = req.headers.get("x-tenant-id");
    if (!tenantId || tenantId.trim() === "") {
      return NextResponse.json(
        { error: "Unauthorized", message: "Tenant isolation violation: missing valid x-tenant-id header." },
        { status: 401 }
      );
    }

    // 2. Extract optional user ID and request ID from request headers
    const userId = req.headers.get("x-user-id") || "system_crawler";
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
    const orchestrator = new CrawlerOrchestrator();
    const result = await orchestrator.runCrawlerCampaign(
      seedUrls,
      tenantId,
      userId,
      requestId
    );

    // 5. Return success result with status 200 OK
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("[API Crawler Campaign Start Route Error]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
