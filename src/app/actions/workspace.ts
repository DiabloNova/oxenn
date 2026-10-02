"use server";

import { AuthorizationError } from "@/services/auth/authorization";
import { requireSession, createSession, getCookieStore } from "@/services/auth/session";
import { requireWorkspaceMembership, requireRole } from "@/services/auth/authorization";
import { TenantContextManager } from "@/core/database/tenant-context";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, organizations, organizationMembers, organizationInvitations } from "../../../database/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID, createHash } from "crypto";
import crypto from "crypto";
import { cookies } from "next/headers";
import { getEmailSender } from "@/services/email/adapters";

import { UserRole } from "@/types/auth";

export async function createWorkspaceAction(name: string) {
  const session = await requireSession();
  if (!session.user) throw new AuthorizationError(401, "Unauthorized: No active session user.");

  const orgId = randomUUID();
  const orgSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${randomUUID().slice(0,4)}`;

  await TenantContextManager.runWithSystemContext(session.user.id, "sys-create-workspace", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    await db.insert(organizations).values({
        id: orgId,
        name,
        slug: orgSlug
    });

    await db.insert(organizationMembers).values({
        organizationId: orgId,
        userId: session.user!.id,
        role: "workspace_admin"
    });
  });

  return { id: orgId, name, slug: orgSlug };
}

export async function listWorkspacesAction() {
  const session = await requireSession();
  if (!session.user) throw new AuthorizationError(401, "Unauthorized: No active session user.");

  return await TenantContextManager.runWithSystemContext(session.user.id, "sys-list-workspaces", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    const records = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        role: organizationMembers.role
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, session.user!.id));

    return records;
  });
}

export async function inviteUserAction(workspaceId: string, email: string, role: string) {
  const session = await requireSession();
  if (!session.user) throw new AuthorizationError(401, "Unauthorized: No active session user.");
  await requireWorkspaceMembership(session.user.id, workspaceId);
  await requireRole("workspace_admin", workspaceId);

  // Test email setup before creating token
  let sender;
  try {
    sender = getEmailSender();
  } catch (e) {
    // If it fails (e.g. no EMAIL_PROVIDER in prod), we will just fallback to returning the token directly.
    sender = null;
  }

  const result = await TenantContextManager.runWithTenantContext(workspaceId, session.user.id, "ctx-invite-user", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    // Ensure user doesn't already exist in workspace
    const existing = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(
        and(
          eq(users.email, email),
          eq(organizationMembers.organizationId, workspaceId)
        )
      )
      .limit(1);

    if (existing.length > 0) throw new Error("User already exists in workspace.");

    const token = randomUUID();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(organizationInvitations).values({
        organizationId: workspaceId,
        email,
        role,
        tokenHash,
        expiresAt
    });

    // Fetch workspace name for email
    const orgs = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, workspaceId)).limit(1);
    const workspaceName = orgs[0]?.name || "Workspace";

    return { success: true, email, workspaceName, token, inviterName: session.user!.name };
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (sender) {
    // Do not await to avoid blocking response
    sender.send({
      to: result.email,
      templateId: "workspace_invitation",
      params: {
        workspaceName: result.workspaceName,
        inviterName: result.inviterName,
        url: `${appUrl}/en/accept-invite?token=${result.token}` // Assuming some front-end route to handle it later
      }
    }).catch((e) => console.error("Email send async error", e));

    return { success: true };
  } else {
    // Fallback: If no provider is available, we return the token in the response so admins can share it manually.
    // This gates the email provider feature while preserving the prior acceptance loop logic in Production.
    return { success: true, token: result.token };
  }
}

export async function acceptInvitationAction(token: string) {
  const session = await requireSession();
  if (!session.user) throw new AuthorizationError(401, "Unauthorized: No active session user.");

  return await TenantContextManager.runWithSystemContext(session.user.id, "sys-accept-invitation", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Find invitation
    const invites = await db
      .select()
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.tokenHash, tokenHash),
          eq(organizationInvitations.status, "pending")
        )
      )
      .limit(1);

    if (invites.length === 0) throw new Error("Invalid or expired invitation");

    const invite = invites[0];

    if (new Date(invite.expiresAt) < new Date()) {
      await db.update(organizationInvitations).set({ status: "expired" }).where(eq(organizationInvitations.id, invite.id));
      throw new Error("Invitation expired");
    }

    if (invite.email !== session.user!.email) {
      throw new Error("Invitation email does not match authenticated user");
    }

    // Accept it
    await db.insert(organizationMembers).values({
      organizationId: invite.organizationId,
      userId: session.user!.id,
      role: invite.role
    });

    await db.update(organizationInvitations).set({ status: "accepted" }).where(eq(organizationInvitations.id, invite.id));

    return { success: true, workspaceId: invite.organizationId };
  });
}

export async function removeMemberAction(workspaceId: string, memberId: string) {
  const session = await requireSession();
  if (!session.user) throw new AuthorizationError(401, "Unauthorized: No active session user.");
  await requireWorkspaceMembership(session.user.id, workspaceId);
  await requireRole("workspace_admin", workspaceId);

  return await TenantContextManager.runWithTenantContext(workspaceId, session.user.id, "ctx-remove-member", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    await client.query("BEGIN");
    try {
      await db.delete(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, workspaceId),
            eq(organizationMembers.userId, memberId)
          )
        );

      await client.query(`
        UPDATE sessions
        SET revoked_at = NOW()
        WHERE user_id = $1 AND workspace_id = $2 AND revoked_at IS NULL
      `, [memberId, workspaceId]);

      await client.query("COMMIT");
    } catch(e) {
      await client.query("ROLLBACK");
      throw e;
    }

    return { success: true };
  });
}

export async function updateMemberRoleAction(workspaceId: string, memberId: string, role: string) {
  const session = await requireSession();
  if (!session.user) throw new AuthorizationError(401, "Unauthorized: No active session user.");
  await requireWorkspaceMembership(session.user.id, workspaceId);
  await requireRole("workspace_admin", workspaceId);

  return await TenantContextManager.runWithTenantContext(workspaceId, session.user.id, "ctx-update-role", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    await db.update(organizationMembers)
      .set({ role })
      .where(
        and(
          eq(organizationMembers.organizationId, workspaceId),
          eq(organizationMembers.userId, memberId)
        )
      );

    return { success: true };
  });
}

export async function switchWorkspaceAction(workspaceId: string) {
  const session = await requireSession();
  if (!session.user) throw new AuthorizationError(401, "Unauthorized: No active session user.");

  await requireWorkspaceMembership(session.user.id, workspaceId);

  const cookieStore = await getCookieStore();
  const cookie = cookieStore.get("oxenn_session");
  if (!cookie || !cookie.value) throw new Error("Unauthorized");

  const rawOldToken = cookie.value;
  const oldTokenHash = crypto.createHash("sha256").update(rawOldToken).digest("hex");

  const rawNewToken = crypto.randomBytes(32).toString("base64url");
  const newTokenHash = crypto.createHash("sha256").update(rawNewToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Re-fetch role for new workspace
  const newRole = await TenantContextManager.runWithSystemContext(session.user.id, "sys-switch-workspace", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    await client.query("BEGIN");
    try {
      const { rows } = await client.query(`
        SELECT role FROM organization_members
        WHERE user_id = $1 AND organization_id = $2
      `, [session.user!.id, workspaceId]);

      const role = rows[0]?.role;
      if (!role) throw new Error("Membership not found");

      const { rows: newSessionRows } = await client.query(`
        INSERT INTO sessions (user_id, token_hash, workspace_id, role_snapshot, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [session.user!.id, newTokenHash, workspaceId, role, expiresAt.toISOString()]);

      const newSessionId = newSessionRows[0].id;

      const upd = await client.query(`
        UPDATE sessions
        SET revoked_at = NOW(), replaced_by = $1
        WHERE token_hash = $2 AND user_id = $3 AND revoked_at IS NULL AND expires_at > NOW()
      `, [newSessionId, oldTokenHash, session.user!.id]);

      if (upd.rowCount !== 1) {
        throw new Error("Unauthorized: session no longer valid");
      }

      await client.query("COMMIT");
      return role;
    } catch(e) {
      await client.query("ROLLBACK");
      throw e;
    }
  });

  cookieStore.set("oxenn_session", rawNewToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });

  return { success: true, workspaceId };
}
