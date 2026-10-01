import { cookies as nextCookies } from "next/headers";
import crypto from "crypto";
import { User, Session } from "@/types/auth";
import { TenantContextManager } from "@/core/database/tenant-context";

let cookiesFn = nextCookies;

/**
 * Utility to override cookies function for unit testing environments.
 */
export function setCookiesMock(mockFn: unknown) {
  cookiesFn = mockFn as typeof nextCookies;
}

const COOKIE_NAME = "oxenn_session";
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Creates a DB-backed session and sets secure cookies.
 */
export async function createSession(user: User): Promise<void> {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

  await TenantContextManager.runWithSystemContext(user.id, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) {
      throw new Error("Failed to get DB client in system context");
    }
    await client.query(`
      INSERT INTO sessions (
        user_id, token_hash, workspace_id, role_snapshot, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5
      )
    `, [user.id, tokenHash, user.workspaceId, user.role, expiresAt.toISOString()]);
  });

  const cookieStore = await cookiesFn();
  cookieStore.set(COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });

  // Keep setting plain cookies for legacy compatibility one-cycle deletion requirement
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
 * Parses and verifies the session token from the cookie, checking against the database.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookiesFn();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie || !cookie.value) {
      return null;
    }

    const rawToken = cookie.value;
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const sessionData = await TenantContextManager.runWithSystemContext(null, "sys-auth-check", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) {
        throw new Error("Failed to get DB client in system context");
      }
      const { rows } = await client.query(`
        SELECT s.id, s.user_id as "userId", s.workspace_id as "workspaceId", s.expires_at as "expiresAt", s.revoked_at as "revokedAt", s.replaced_by as "replacedBy",
               u.email, u.name,
               m.role
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN organization_members m ON s.workspace_id = m.organization_id AND s.user_id = m.user_id
        WHERE s.token_hash = $1
      `, [tokenHash]);

      return rows[0];
    });

    if (!sessionData) return null;
    if (sessionData.revokedAt) return null;
    if (sessionData.replacedBy) return null;
    if (new Date(sessionData.expiresAt) < new Date()) return null;
    if (!sessionData.role) return null; // No active membership for the workspace

    return {
      user: {
        id: sessionData.userId,
        name: sessionData.name,
        email: sessionData.email,
        role: sessionData.role,
        workspaceId: sessionData.workspaceId,
      },
      expiresAt: sessionData.expiresAt.toISOString(),
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
 * Invalidates the authoritative session on the server and deletes the cookies.
 */
export async function invalidateSession(): Promise<void> {
  const cookieStore = await cookiesFn();
  const cookie = cookieStore.get(COOKIE_NAME);

  if (cookie && cookie.value) {
    const rawToken = cookie.value;
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) throw new Error("Failed to get DB client in system context");

      await client.query(`
        UPDATE sessions
        SET revoked_at = NOW()
        WHERE token_hash = $1
      `, [tokenHash]);
    });
  }

  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete("tenant_id");
  cookieStore.delete("user_id");
}

export async function revokeAllForUser(userId: string): Promise<void> {
  await TenantContextManager.runWithSystemContext(userId, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    await client.query(`
      UPDATE sessions
      SET revoked_at = NOW()
      WHERE user_id = $1 AND revoked_at IS NULL
    `, [userId]);
  });
}
