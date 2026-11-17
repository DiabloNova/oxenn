"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";
import { shouldSkipHomepageSessionLookup } from "@/lib/auth/route-policy";

export function RouteAwareAuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const skipSessionCheck = shouldSkipHomepageSessionLookup(pathname);

  return (
    <AuthProvider key={skipSessionCheck ? "public-home" : "workspace"} skipSessionCheck={skipSessionCheck}>
      {children}
    </AuthProvider>
  );
}
