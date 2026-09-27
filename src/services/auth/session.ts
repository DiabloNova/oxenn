import { cookies as nextCookies } from "next/headers";
import crypto from "crypto";
import { User, Session } from "@/types/auth";

let cookiesFn = nextCookies;

/**
 * Utility to override cookies function for unit testing environments.
 */
export function setCookiesMock(mockFn: unknown) {
  cookiesFn = mockFn as typeof nextCookies;
}

// Resolve the session secret safely.
// Generates a cryptographically secure random key if SESSION_SECRET is not configured in the environment.
// This prevents silent use of any guessable, insecure hard-coded fallback secrets,
// and ensures Next.js "pnpm run build" can execute page data collection successfully.
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const COOKIE_NAME = "seorchable_session";
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SessionPayload {
  user: User;
  expiresAt: string;
}

export function signPayload(payloadStr: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payloadStr).digest("hex");
}

export function verifyPayload(payloadStr: string, signature: string): boolean {
  const expected = signPayload(payloadStr);
  if (signature.length !== expected.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Creates a cryptographically signed, integrity-protected server session and sets secure cookies.
 */
export async function createSession(user: User): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
  const payload: SessionPayload = {
    user,
    expiresAt: expiresAt.toISOString(),
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString("base64url");
  const signature = signPayload(payloadBase64);
  const cookieValue = `${payloadBase64}.${signature}`;

  const cookieStore = await cookiesFn();
  cookieStore.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });

  // Keep setting plain cookies for legacy compatibility, but they are NOT treated as authoritative on the server
  cookieStore.set("tenant_id", user.workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
  cookieStore.set("user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Parses and verifies the signed server session cookie, checking integrity and expiration.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookiesFn();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie || !cookie.value) {
      return null;
    }

    const parts = cookie.value.split(".");
    if (parts.length !== 2) {
      return null;
    }

    const [payloadBase64, signature] = parts;
    if (!verifyPayload(payloadBase64, signature)) {
      return null;
    }

    const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr) as SessionPayload;

    if (new Date(payload.expiresAt) < new Date()) {
      return null; // Expired
    }

    return {
      user: payload.user,
      expiresAt: payload.expiresAt,
      status: "authenticated",
    };
  } catch (err) {
    return null;
  }
}

/**
 * Asserts that an active, valid session exists on the server, otherwise fails closed by throwing an error.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Active session is missing, invalid or expired.");
  }
  return session;
}

/**
 * Helper to retrieve only the User entity from a validated session.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const session = await getSession();
  return session ? session.user : null;
}

/**
 * Invalidates the authoritative session on the server and expires the cookies.
 */
export async function invalidateSession(): Promise<void> {
  const cookieStore = await cookiesFn();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete("tenant_id");
  cookieStore.delete("user_id");
}
