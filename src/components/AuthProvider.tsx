"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session, UserRole } from "@/types/auth";
import { loginAction, logoutAction, getServerSessionAction, registerAction } from "@/app/actions/auth";

interface AuthContextType {
  session: Session;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(() => {
    return {
      user: null,
      expiresAt: null,
      status: "loading",
    };
  });

  useEffect(() => {
    // Check the authoritative server-side session first
    getServerSessionAction()
      .then((serverSession) => {
        if (serverSession.status === "authenticated" && serverSession.user) {
          // Synchronize local storage with the authoritative server identity
          localStorage.setItem("auth_session_user", JSON.stringify(serverSession.user));
          setSession(serverSession);
        } else {
          // If no server session, clear client-controlled identity completely (fail closed)
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
        // Fallback safely to unauthenticated to prevent unauthorized layout bypass
        localStorage.removeItem("auth_session_user");
        setSession({
          user: null,
          expiresAt: null,
          status: "unauthenticated",
        });
      });
  }, []);

  const login = async (email: string, password: string) => {
    setSession((prev) => ({ ...prev, status: "loading" }));

    try {
      // Prepare for future backend API integration here
      // e.g. const res = await fetch("/api/v1/auth/login", { ... })
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Secure server-side login strictly on the server to prevent client-controlled spoofing
      const user = await loginAction(email, password);

      localStorage.setItem("auth_session_user", JSON.stringify(user));

      setSession({
        user,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "authenticated",
      });
    } catch (e) {
      setSession({
        user: null,
        expiresAt: null,
        status: "unauthenticated",
      });
      throw e;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setSession((prev) => ({ ...prev, status: "loading" }));

    try {
      // Prepare for future backend API integration here
      // e.g. const res = await fetch("/api/v1/auth/register", { ... })
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Secure server-side registration strictly on the server to prevent client-controlled spoofing
      await registerAction(name, email, password);

      // Do NOT sign in the user after register, because registration does not create a session
      setSession({
        user: null,
        expiresAt: null,
        status: "unauthenticated",
      });
    } catch (e) {
      setSession({
        user: null,
        expiresAt: null,
        status: "unauthenticated",
      });
      throw e;
    }
  };

  const logout = async () => {
    setSession((prev) => ({ ...prev, status: "loading" }));
    await new Promise((resolve) => setTimeout(resolve, 400));

    localStorage.removeItem("auth_session_user");

    // Clear secure server-side cookies
    await logoutAction();

    setSession({
      user: null,
      expiresAt: null,
      status: "unauthenticated",
    });
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!session.user) return false;

    const roleHierarchy: Record<UserRole, number> = {
      super_admin: 3,
      workspace_admin: 2,
      viewer: 1,
    };

    const userRoleValue = roleHierarchy[session.user.role];
    const requiredRoleValue = roleHierarchy[requiredRole];

    return userRoleValue >= requiredRoleValue;
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
