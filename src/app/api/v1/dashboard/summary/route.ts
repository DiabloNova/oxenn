import { NextRequest, NextResponse } from "next/server";
import { dashboardHomeService } from "@/services/dashboard-home";
import { authorizationErrorResponse, authorizeApiRequest } from "@/services/auth/authorization";

export async function GET(req: NextRequest) {
  try {
    // 1. Authorize API Request, resolving secure server context
    await authorizeApiRequest(req);

    const { searchParams } = new URL(req.url);
    const locale = (searchParams.get("locale") as "en" | "fa") || "fa";

    // 2. Aggregate dashboard statistics securely
    const summary = await dashboardHomeService.getDashboardSummary(locale);

    return NextResponse.json(summary);
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[Dashboard Summary API Route Error]:", error);
    const message = error instanceof Error ? error.message : "خطای ناشناخته در دریافت اطلاعات داشبورد.";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
