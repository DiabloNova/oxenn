"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";
import { shouldSkipHomepageSessionLookup } from "@/lib/auth/route-policy";

export function RouteAwareAuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthProvider skipSessionCheck={shouldSkipHomepageSessionLookup(pathname)}>
      {children}
    </AuthProvider>
  );
}
