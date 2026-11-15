"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Session, UserRole } from "@/types/auth";
import { loginAction, logoutAction, getServerSessionAction, registerAction } from "@/app/actions/auth";

interface AuthContextType {
  session: Session;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string, username: string, locale: "fa" | "en") => Promise<{ verificationEmailSent: boolean }>;
  refreshSession: () => Promise<Session>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({ user: null, expiresAt: null, status: "loading" });

  const refreshSession = useCallback(async (): Promise<Session> => {
    try {
      const serverSession = await getServerSessionAction();
      if (serverSession.status === "authenticated" && serverSession.user) {
        localStorage.setItem("auth_session_user", JSON.stringify(serverSession.user));
      } else {
        localStorage.removeItem("auth_session_user");
      }
      setSession(serverSession);
      return serverSession;
    } catch (error) {
      localStorage.removeItem("auth_session_user");
      const unauthenticated: Session = { user: null, expiresAt: null, status: "unauthenticated" };
      setSession(unauthenticated);
      throw error;
    }
  }, []);

  useEffect(() => {
    refreshSession().catch((error) => {
      console.error("Failed to fetch authoritative server session:", error);
    });
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    setSession((previous) => ({ ...previous, status: "loading" }));
    try {
      const user = await loginAction(email, password);
      localStorage.setItem("auth_session_user", JSON.stringify(user));
      setSession({ user, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), status: "authenticated" });
    } catch (error) {
      localStorage.removeItem("auth_session_user");
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
      localStorage.removeItem("auth_session_user");
      setSession({ user: null, expiresAt: null, status: "unauthenticated" });
      return { verificationEmailSent: result.verificationEmailSent };
    } catch (error) {
      localStorage.removeItem("auth_session_user");
      setSession({ user: null, expiresAt: null, status: "unauthenticated" });
      throw error;
    }
  };

  const logout = async () => {
    setSession((previous) => ({ ...previous, status: "loading" }));
    localStorage.removeItem("auth_session_user");
    await logoutAction();
    setSession({ user: null, expiresAt: null, status: "unauthenticated" });
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!session.user) return false;
    const hierarchy: Record<UserRole, number> = { super_admin: 3, workspace_admin: 2, viewer: 1 };
    return hierarchy[session.user.role] >= hierarchy[requiredRole];
  };

  return <AuthContext.Provider value={{ session, login, register, refreshSession, logout, hasPermission }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
