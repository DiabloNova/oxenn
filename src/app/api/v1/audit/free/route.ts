import { createHash, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";
import {
  authorizationErrorResponse,
  authorizeApiRequest
} from "@/services/auth/authorization";
import { TenantContextManager } from "@/core/database/tenant-context";
import { HttpCrawlProvider } from "@/features/acquisition/infrastructure/providers/http-crawl-provider";
import type { CrawlRequest } from "@/features/acquisition/domain/contracts";
import { CrawlError } from "@/features/acquisition/domain/errors";
import { resolveCrawlPolicy } from "@/features/acquisition/domain/policy";
import { normalizeUrl } from "@/features/acquisition/domain/url/normalizer";

const requestSchema = z.object({
  url: z.string().url("لطفاً یک آدرس وب‌سایت معتبر وارد کنید (مثال: https://example.com)").max(2048)
}).strict();
const MAX_BODY_BYTES = 4096;
const USER_MONTHLY_LIMIT = 3;
const IP_HOURLY_LIMIT = 10;
const GLOBAL_DAILY_LIMIT = 500;
const IDEMPOTENCY_WINDOW_MS = 15 * 60 * 1000;

export const runtime = "nodejs";

export interface FreeAuditResponse {
  mode: "LIVE";
  scope: "single-page";
  crawl: {
    provider: "internal-http";
    pages: number;
    bytesProcessed: number;
    durationMs: number;
    partial: boolean;
  };
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: {
    hasTitle: boolean;
    titleLength: "good" | "too_short" | "too_long" | "missing";
    hasMetaDescription: boolean;
    metaDescriptionLength: "good" | "too_short" | "too_long" | "missing";
    hasH1: boolean;
    isHttps: boolean;
    hasLanguage: boolean;
    isIndexable: boolean;
  };
  quickTips: Array<{ issue: string; recommendation: string }>;
  premiumUpsell: { locked: boolean; message: string; features: string[] };
}

type LimitDecision = { status: number; message: string; retryAfterSeconds?: number } | null;
type QuotaReservation = { decision: LimitDecision; quotaBucketKey: string; idempotencyBucketKey: string | null };

function hashBucket(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function nextUtcHour(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() + 1));
}

function nextUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

function nextUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

function secondsUntil(date: Date, now: Date): number {
  return Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 1000));
}

class PayloadTooLargeError extends Error {}

async function readBoundedBody(request: NextRequest): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new PayloadTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString("utf8");
}

async function incrementCounter(
  client: { query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<{ attempts: number | string }> }> },
  endpoint: string,
  bucketKey: string,
  expiresAt: Date
): Promise<number> {
  const { rows } = await client.query(
    `INSERT INTO auth_rate_limits (endpoint, bucket_key, attempts, expires_at)
     VALUES ($1, $2, 1, $3)
     ON CONFLICT (endpoint, bucket_key) DO UPDATE
     SET attempts = CASE
           WHEN auth_rate_limits.expires_at <= NOW() THEN 1
           ELSE auth_rate_limits.attempts + 1
         END,
         expires_at = CASE
           WHEN auth_rate_limits.expires_at <= NOW() THEN EXCLUDED.expires_at
           ELSE auth_rate_limits.expires_at
         END
     RETURNING attempts`,
    [endpoint, bucketKey, expiresAt.toISOString()]
  );
  const attempts = Number(rows[0]?.attempts);
  if (!Number.isSafeInteger(attempts) || attempts < 1) {
    throw new Error("Free audit rate-limit storage returned an invalid counter");
  }
  return attempts;
}

async function deleteIdempotencyReservation(
  client: Parameters<typeof incrementCounter>[0],
  bucketKey: string
): Promise<void> {
  await client.query("DELETE FROM auth_rate_limits WHERE endpoint = $1 AND bucket_key = $2", ["free-audit-idempotency", bucketKey]);
}
async function reserveFreeAudit(
  userId: string,
  request: NextRequest
): Promise<QuotaReservation> {
  const now = new Date();
  const monthExpiry = nextUtcMonth(now);
  const hourExpiry = nextUtcHour(now);
  const dayExpiry = nextUtcDay(now);
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const quotaBucketKey = hashBucket(`${userId}:${month}`);
  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey !== null && !/^[\x21-\x7e]{8,128}$/.test(idempotencyKey)) {
    return { decision: { status: 400, message: "کلید تکرار درخواست نامعتبر است." }, quotaBucketKey, idempotencyBucketKey: null };
  }

  const idempotencyBucketKey = idempotencyKey ? hashBucket(`${userId}:${idempotencyKey}`) : null;

  // x-real-ip is only trusted on Vercel, where the ingress supplies this header.
  // Never trust a caller-provided X-Forwarded-For chain.
  const rawIp = process.env.VERCEL === "1" ? request.headers.get("x-real-ip") : null;
  const trustedIp = rawIp && isIP(rawIp.trim()) !== 0 ? rawIp.trim() : null;

  const decision = await TenantContextManager.runWithSystemContext(userId, "sys-free-audit", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Free audit database context is unavailable");

    // Return decisions so denied-attempt counters commit instead of being rolled back.
    if (idempotencyBucketKey) {
      const duplicateAttempts = await incrementCounter(
        client,
        "free-audit-idempotency",
        idempotencyBucketKey,
        new Date(now.getTime() + IDEMPOTENCY_WINDOW_MS)
      );
      if (duplicateAttempts > 1) {
        return { status: 409, message: "این درخواست با همین کلید قبلاً ثبت شده است؛ برای تلاش جدید کلید تازه‌ای ارسال کنید.", retryAfterSeconds: secondsUntil(new Date(now.getTime() + IDEMPOTENCY_WINDOW_MS), now) };
      }
    }

    if (trustedIp) {
      const ipAttempts = await incrementCounter(client, "free-audit-ip", hashBucket(trustedIp), hourExpiry);
      if (ipAttempts > IP_HOURLY_LIMIT) {
        if (idempotencyBucketKey) await deleteIdempotencyReservation(client, idempotencyBucketKey);
        return { status: 429, message: "تعداد درخواست‌های این شبکه در بازهٔ زمانی فعلی بیش از حد مجاز است.", retryAfterSeconds: secondsUntil(hourExpiry, now) };
      }
    }

    // Check the user's monthly limit before consuming shared daily capacity.
    const userAttempts = await incrementCounter(client, "free-audit-user", quotaBucketKey, monthExpiry);
    if (userAttempts > USER_MONTHLY_LIMIT) {
      if (idempotencyBucketKey) await deleteIdempotencyReservation(client, idempotencyBucketKey);
      return { status: 429, message: "سهمیهٔ ممیزی رایگان این حساب برای ماه جاری به پایان رسیده است.", retryAfterSeconds: secondsUntil(monthExpiry, now) };
    }

    const globalAttempts = await incrementCounter(client, "free-audit-global", "global", dayExpiry);
    if (globalAttempts > GLOBAL_DAILY_LIMIT) {
      // The global service is unavailable; refund the monthly reservation in this transaction.
      await client.query(
        "UPDATE auth_rate_limits SET attempts = GREATEST(attempts - 1, 0) WHERE endpoint = $1 AND bucket_key = $2",
        ["free-audit-user", quotaBucketKey]
      );
      if (idempotencyBucketKey) await deleteIdempotencyReservation(client, idempotencyBucketKey);
      return { status: 503, message: "سرویس ممیزی موقتاً به سقف ظرفیت روزانه رسیده است.", retryAfterSeconds: secondsUntil(dayExpiry, now) };
    }
    return null;
  });
  return { decision, quotaBucketKey, idempotencyBucketKey };
}

async function releaseFreeAuditReservation(
  userId: string,
  quotaBucketKey: string,
  idempotencyBucketKey: string | null
): Promise<void> {
  await TenantContextManager.runWithSystemContext(userId, "sys-free-audit", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Free audit reservation release context is unavailable");
    await client.query(
      "UPDATE auth_rate_limits SET attempts = GREATEST(attempts - 1, 0) WHERE endpoint = $1 AND bucket_key = $2",
      ["free-audit-user", quotaBucketKey]
    );
    if (idempotencyBucketKey) {
      await deleteIdempotencyReservation(client, idempotencyBucketKey);
    }
  });
}

function buildResponse(html: string, requestedUrl: string, crawl: {
  pages: number; bytesProcessed: number; durationMs: number; partial: boolean;
}): FreeAuditResponse {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  const description = $("meta[name='description']").attr("content")?.trim() ?? "";
  const language = $("html").attr("lang")?.trim() ?? "";
  const robots = [
    $("meta[name='robots']").attr("content") ?? "",
    $("meta[name='googlebot']").attr("content") ?? ""
  ].join(",").toLowerCase();
  const hasTitle = title.length > 0;
  const hasMetaDescription = description.length > 0;
  const hasH1 = $("h1").length > 0;
  const isHttps = new URL(requestedUrl).protocol === "https:";
  const hasLanguage = language.length > 0;
  const isIndexable = !/(^|[,\s])noindex([,\s]|$)/.test(robots) && !/(^|[,\s])nofollow([,\s]|$)/.test(robots);

  let score = 0;
  let titleLength: FreeAuditResponse["checks"]["titleLength"] = "missing";
  if (hasTitle) {
    titleLength = title.length >= 50 && title.length <= 60 ? "good" : title.length < 50 ? "too_short" : "too_long";
    score += titleLength === "good" ? 20 : 10;
  }
  let metaDescriptionLength: FreeAuditResponse["checks"]["metaDescriptionLength"] = "missing";
  if (hasMetaDescription) {
    metaDescriptionLength = description.length >= 150 && description.length <= 160 ? "good" : description.length < 150 ? "too_short" : "too_long";
    score += metaDescriptionLength === "good" ? 20 : 10;
  }
  if (hasH1) score += 15;
  if (isHttps) score += 10;
  if (hasLanguage) score += 10;
  if (isIndexable) score += 25;

  const grade: FreeAuditResponse["grade"] = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 45 ? "D" : "F";
  const quickTips: FreeAuditResponse["quickTips"] = [];
  if (!hasTitle || titleLength !== "good") quickTips.push({ issue: "عنوان صفحه وجود ندارد یا طول مناسبی ندارد.", recommendation: "عنوانی روشن و مرتبط با محتوای صفحه، ترجیحاً در بازهٔ ۵۰ تا ۶۰ نویسه بنویسید." });
  if (!hasMetaDescription || metaDescriptionLength !== "good") quickTips.push({ issue: "توضیحات متای صفحه وجود ندارد یا طول مناسبی ندارد.", recommendation: "توضیحی دقیق و منحصربه‌فرد، ترجیحاً در بازهٔ ۱۵۰ تا ۱۶۰ نویسه اضافه کنید." });
  if (!hasH1) quickTips.push({ issue: "عنوان اصلی H1 در صفحه پیدا نشد.", recommendation: "یک عنوان H1 واضح و منطبق با موضوع اصلی صفحه اضافه کنید." });
  if (!isHttps) quickTips.push({ issue: "صفحه از HTTPS استفاده نمی‌کند.", recommendation: "گواهی TLS را فعال و نسخهٔ HTTPS را به نشانی اصلی تبدیل کنید." });
  if (!hasLanguage) quickTips.push({ issue: "زبان سند در تگ HTML مشخص نشده است.", recommendation: "ویژگی lang را روی تگ html تنظیم کنید." });
  if (!isIndexable) quickTips.push({ issue: "متادادهٔ robots مانع ایندکس یا دنبال‌کردن پیوندها می‌شود.", recommendation: "مقدار noindex/nofollow را با سیاست ایندکس موردنظر خود تطبیق دهید." });
  if (quickTips.length === 0) quickTips.push({ issue: "بررسی‌های پایهٔ این صفحه موفق بودند.", recommendation: "این نتیجه فقط ممیزی فنی یک صفحه است و جایگزین بررسی جامع سایت یا تحلیل حضور برند نیست." });

  return {
    mode: "LIVE",
    scope: "single-page",
    crawl: { provider: "internal-http", ...crawl },
    score,
    grade,
    checks: { hasTitle, titleLength, hasMetaDescription, metaDescriptionLength, hasH1, isHttps, hasLanguage, isIndexable },
    quickTips: quickTips.slice(0, 3),
    premiumUpsell: {
      locked: true,
      message: "این نسخه فقط شاخص‌های فنی پایهٔ یک صفحه را بررسی می‌کند.",
      features: ["خزش چندصفحه‌ای و تحلیل ساختار سایت", "تحلیل داده‌های ساختاریافته و موجودیت‌ها", "تحلیل AEO/GEO و گزارش‌های پیشرفته"]
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    // Authentication precedes body parsing and all quota/crawl work.
    const identity = await authorizeApiRequest(req);

    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload Too Large", message: "اندازهٔ درخواست بیش از حد مجاز است." }, { status: 413 });
    }
    let rawBody: string;
    try {
      rawBody = await readBoundedBody(req);
    } catch (bodyError) {
      if (bodyError instanceof PayloadTooLargeError) {
        return NextResponse.json({ error: "Payload Too Large", message: "اندازهٔ درخواست بیش از حد مجاز است." }, { status: 413 });
      }
      throw bodyError;
    }

    let body: unknown;
    try { body = JSON.parse(rawBody); } catch {
      return NextResponse.json({ error: "Bad Request", message: "بدنهٔ درخواست باید JSON معتبر باشد." }, { status: 400 });
    }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Bad Request", message: parsed.error.issues[0]?.message ?? "درخواست نامعتبر است." }, { status: 400 });
    }
    const normalized = normalizeUrl(parsed.data.url, true);
    if (!normalized.ok) {
      return NextResponse.json({ error: "Invalid URL", message: "نشانی واردشده معتبر یا مجاز نیست." }, { status: 400 });
    }

    const reservation = await reserveFreeAudit(identity.userId, req);
    const limitDecision = reservation.decision;
    if (limitDecision) {
      return NextResponse.json(
        { error: limitDecision.status === 409 ? "Conflict" : limitDecision.status === 400 ? "Bad Request" : limitDecision.status === 503 ? "Service Unavailable" : "Rate Limited", message: limitDecision.message },
        {
          status: limitDecision.status,
          headers: limitDecision.retryAfterSeconds ? { "Retry-After": String(limitDecision.retryAfterSeconds) } : undefined
        }
      );
    }

    const policy = resolveCrawlPolicy({
      maxPages: 1,
      maxDepth: 0,
      maxDurationMs: 20_000,
      maxResponseBytes: 1024 * 1024,
      maxTotalBytes: 1024 * 1024,
      maxRedirects: 3,
      maxConcurrency: 1,
      requestTimeoutMs: 8_000,
      connectTimeoutMs: 4_000,
      maxAttempts: 1,
      retryBaseDelayMs: 0,
      retryMaxDelayMs: 0,
      allowedSchemes: ["http", "https"],
      allowedContentTypes: ["text/html", "application/xhtml+xml"],
      robotsPolicy: "respect",
      perHostRequestsPerSecond: 1,
      stripTrackingParams: true,
      cacheTtlMs: 0,
      followRedirects: true
    });
    const crawlRequest: CrawlRequest = {
      tenantId: identity.tenantId,
      requestedUrl: parsed.data.url,
      normalizedUrl: normalized.value,
      policy,
      priority: 0,
      correlationId: randomUUID()
    };
    const startedAt = Date.now();
    let reservationReleaseAttempted = false;
    const releaseReservationOnce = async () => {
      if (reservationReleaseAttempted) return;
      reservationReleaseAttempted = true;
      try {
        await releaseFreeAuditReservation(identity.userId, reservation.quotaBucketKey, reservation.idempotencyBucketKey);
      } catch (releaseError) {
        console.error("[Free Audit] Reservation release failed", releaseError instanceof Error ? releaseError.name : "UnknownError");
      }
    };
    try {
      const result = await new HttpCrawlProvider().execute(crawlRequest, policy, req.signal);
      const document = result.documents[0];
      if (!document?.html || result.pageCount !== 1) {
        await releaseReservationOnce();
        return NextResponse.json(
          { error: "Crawl Unavailable", message: "این صفحه قابل دریافت یا بررسی نیست؛ ممکن است سیاست robots.txt دسترسی را محدود کرده باشد." },
          { status: 422 }
        );
      }

      const payload = buildResponse(document.html, document.finalUrl, {
        pages: result.pageCount,
        bytesProcessed: result.bytesProcessed,
        durationMs: result.durationMs || Date.now() - startedAt,
        partial: result.partial
      });
      return NextResponse.json(payload, { status: 200 });
    } catch (crawlError) {
      await releaseReservationOnce();
      throw crawlError;
    }
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof CrawlError) {
      const status = error.code === "SSRF_BLOCKED" || error.code === "POLICY_VIOLATION" ? 400 : error.code === "TIMEOUT" ? 504 : 502;
      return NextResponse.json({ error: "Crawl Failed", message: "ممیزی صفحه با شکست مواجه شد؛ نشانی را بررسی کنید و بعداً دوباره تلاش کنید." }, { status });
    }
    console.error("[Free Audit] Request failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Internal Server Error", message: "اجرای ممیزی موقتاً ممکن نیست." }, { status: 500 });
  }
}
