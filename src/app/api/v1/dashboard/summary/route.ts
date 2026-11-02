import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError } from "@/services/auth/authorization";
import { dashboardHomeService } from "@/services/dashboard-home";
import { authorizeApiRequest } from "@/services/auth/authorization";

export async function GET(req: NextRequest) {
  try {
    // 1. Authorize API Request, resolving secure server context
    const context = await authorizeApiRequest(req);
    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized", message: "شناسه کاربری نامعتبر است. لطفاً مجدداً وارد شوید." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const locale = (searchParams.get("locale") as "en" | "fa") || "fa";

    // 2. Aggregate dashboard statistics securely
    const summary = await dashboardHomeService.getDashboardSummary(locale);

    return NextResponse.json(summary);
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.statusCode === 403 ? "Forbidden" : "Unauthorized", message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[Dashboard Summary API Route Error]:", error);
    const message = error instanceof Error ? error.message : "خطای ناشناخته در دریافت اطلاعات داشبورد.";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
