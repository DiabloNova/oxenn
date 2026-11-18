"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Session, UserRole } from "@/types/auth";
import { loginAction, logoutAction, getServerSessionAction, registerAction } from "@/app/actions/auth";

interface AuthContextType {
  session: Session;
  login: (email: string, password: string) => Promise<{ errorCode?: "EMAIL_NOT_VERIFIED" }>;
  register: (firstName: string, lastName: string, email: string, password: string, username: string, locale: "fa" | "en") => Promise<{ verificationEmailSent: boolean }>;
  refreshSession: () => Promise<Session>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PUBLIC_UNAUTHENTICATED_SESSION: Session = {
  user: null,
  expiresAt: null,
  status: "unauthenticated",
};

// This legacy cache is best-effort only. The server-backed session remains authoritative.
function cacheSessionUser(user: Session["user"]): void {
  try {
    if (typeof window === "undefined") return;
    if (user) {
      window.localStorage.setItem("auth_session_user", JSON.stringify(user));
    } else {
      window.localStorage.removeItem("auth_session_user");
    }
  } catch {
    // Browser storage can be unavailable (for example, in restricted contexts).
  }
}

function clearCachedSessionUser(): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("auth_session_user");
    }
  } catch {
    // Cache cleanup must never prevent server-side authentication actions.
  }
}

async function synchronizeServerSession(): Promise<Session> {
  try {
    const serverSession = await getServerSessionAction();
    if (serverSession.status === "authenticated" && serverSession.user) {
      cacheSessionUser(serverSession.user);
    } else {
      clearCachedSessionUser();
    }
    return serverSession;
  } catch (error) {
    clearCachedSessionUser();
    throw error;
  }
}

export function AuthProvider({
  children,
  skipSessionCheck = false,
}: {
  children: React.ReactNode;
  skipSessionCheck?: boolean;
}) {
  const [session, setSession] = useState<Session>({ user: null, expiresAt: null, status: "loading" });

  const refreshSession = useCallback(async (): Promise<Session> => {
    try {
      const serverSession = await synchronizeServerSession();
      setSession(serverSession);
      return serverSession;
    } catch (error) {
      const unauthenticated: Session = { user: null, expiresAt: null, status: "unauthenticated" };
      setSession(unauthenticated);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (skipSessionCheck) {
      // Public marketing pages do not need Workspace-backed identity or browser storage.
      return;
    }

    let active = true;

    synchronizeServerSession()
      .then((serverSession) => {
        if (!active) return;
        setSession(serverSession);
      })
      .catch((error) => {
        if (!active) return;
        clearCachedSessionUser();
        setSession({ user: null, expiresAt: null, status: "unauthenticated" });
        console.error("Failed to fetch authoritative server session:", error);
      });

    return () => {
      active = false;
    };
  }, [skipSessionCheck]);

  const login = async (email: string, password: string) => {
    setSession((previous) => ({ ...previous, status: "loading" }));
    try {
      const result = await loginAction(email, password);
      if (!result.success) {
        clearCachedSessionUser();
        setSession({ user: null, expiresAt: null, status: "unauthenticated" });
        return { errorCode: result.errorCode };
      }
      cacheSessionUser(result.user);
      setSession({ user: result.user, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), status: "authenticated" });
      return {};
    } catch (error) {
      clearCachedSessionUser();
      setSession({ user: null, expiresAt: null, status: "unauthenticated" });
      throw error;
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string, username: string, locale: "fa" | "en") => {
    setSession((previous) => ({ ...previous, status: "loading" }));
    try {
      const result = await registerAction(firstName, lastName, email, password, username, locale);
      if ("errorCode" in result) {
        throw Object.assign(new Error("Registration failed."), { code: result.errorCode });
      }
      clearCachedSessionUser();
      setSession({ user: null, expiresAt: null, status: "unauthenticated" });
      return { verificationEmailSent: result.verificationEmailSent };
    } catch (error) {
      clearCachedSessionUser();
      setSession({ user: null, expiresAt: null, status: "unauthenticated" });
      throw error;
    }
  };

  const logout = async () => {
    const previousSession = session;
    setSession((previous) => ({ ...previous, status: "loading" }));
    try {
      // Revoke the authoritative server session before doing any client-side cleanup.
      await logoutAction();
    } catch (error) {
      setSession(previousSession);
      throw error;
    }
    clearCachedSessionUser();
    setSession({ user: null, expiresAt: null, status: "unauthenticated" });
  };

  const effectiveSession = skipSessionCheck ? PUBLIC_UNAUTHENTICATED_SESSION : session;

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!effectiveSession.user) return false;
    const roleHierarchy: Record<UserRole, number> = {
      super_admin: 3,
      workspace_admin: 2,
      viewer: 1,
    };
    return roleHierarchy[effectiveSession.user.role] >= roleHierarchy[requiredRole];
  };

  return (
    <AuthContext.Provider value={{ session: effectiveSession, login, register, refreshSession, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
