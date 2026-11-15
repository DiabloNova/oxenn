"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session, UserRole } from "@/types/auth";
import { loginAction, logoutAction, getServerSessionAction, registerAction } from "@/app/actions/auth";

interface AuthContextType {
  session: Session;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, workspaceName?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  skipSessionCheck = false,
}: {
  children: React.ReactNode;
  skipSessionCheck?: boolean;
}) {
  const [session, setSession] = useState<Session>(() => ({
    user: null,
    expiresAt: null,
    status: "loading",
  }));

  useEffect(() => {
    if (skipSessionCheck) {
      // The public homepage does not need Workspace-backed identity. Keep its
      // context unauthenticated without calling the DB-backed session action.
      localStorage.removeItem("auth_session_user");
      setSession({
        user: null,
        expiresAt: null,
        status: "unauthenticated",
      });
      return;
    }

    // Check the authoritative server-side session first on auth/workspace routes.
    getServerSessionAction()
      .then((serverSession) => {
        if (serverSession.status === "authenticated" && serverSession.user) {
          localStorage.setItem("auth_session_user", JSON.stringify(serverSession.user));
          setSession(serverSession);
        } else {
          localStorage.removeItem("auth_session_user");
          setSession({
            user: null,
            expiresAt: null,
            status: "unauthenticated",
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch authoritative server session:", err);
        localStorage.removeItem("auth_session_user");
        setSession({
          user: null,
          expiresAt: null,
          status: "unauthenticated",
        });
      });
  }, [skipSessionCheck]);

  const login = async (email: string, password: string) => {
    setSession((prev) => ({ ...prev, status: "loading" }));
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const user = await loginAction(email, password);
      localStorage.setItem("auth_session_user", JSON.stringify(user));
      setSession({
        user,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "authenticated",
      });
    } catch (e) {
      setSession({ user: null, expiresAt: null, status: "unauthenticated" });
      throw e;
    }
  };

  const register = async (name: string, email: string, password: string, workspaceName?: string) => {
    setSession((prev) => ({ ...prev, status: "loading" }));
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const result = await registerAction(name, email, password, workspaceName);
      if ("errorCode" in result) {
        throw Object.assign(new Error("Registration failed."), { code: result.errorCode });
      }
      setSession({ user: null, expiresAt: null, status: "unauthenticated" });
    } catch (e) {
      setSession({ user: null, expiresAt: null, status: "unauthenticated" });
      throw e;
    }
  };

  const logout = async () => {
    setSession((prev) => ({ ...prev, status: "loading" }));
    await new Promise((resolve) => setTimeout(resolve, 400));
    localStorage.removeItem("auth_session_user");
    await logoutAction();
    setSession({ user: null, expiresAt: null, status: "unauthenticated" });
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!session.user) return false;
    const roleHierarchy: Record<UserRole, number> = {
      super_admin: 3,
      workspace_admin: 2,
      viewer: 1,
    };
    return roleHierarchy[session.user.role] >= roleHierarchy[requiredRole];
  };

  return (
    <AuthContext.Provider value={{ session, login, register, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
