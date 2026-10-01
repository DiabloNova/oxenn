import { Session, User } from "@/types/auth";

export const authService = {
  async getSession(): Promise<Session> {
    if (typeof window === "undefined") return { user: null, expiresAt: null, status: "unauthenticated" };

    const userStr = localStorage.getItem("auth_session_user");
    if (!userStr) return { user: null, expiresAt: null, status: "unauthenticated" };

    try {
      const user = JSON.parse(userStr) as User;
      return {
        user,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "authenticated",
      };
    } catch {
      return { user: null, expiresAt: null, status: "unauthenticated" };
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem("auth_session_user");
  }
};
