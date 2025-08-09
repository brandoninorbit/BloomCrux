// src/hooks/useAuthRedirect.ts
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserAuth } from "@/context/AuthContext";

// Redirects signed-in users away from auth pages, and can optionally
// protect private pages by kicking guests to /login.
export function useAuthRedirect(options?: { protect?: boolean }) {
  const { protect = false } = options ?? {};
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUserAuth?.() ?? { user: null, loading: false };

  useEffect(() => {
    if (loading) return;

    // If we’re on login/signup and already logged in → go home
    const isAuthPage =
      pathname?.startsWith("/login") || pathname?.startsWith("/signup");

    if (user && isAuthPage) {
      router.replace("/home");
      return;
    }

    // If this page is protected and user is not logged in → go to login
    if (protect && !user && !isAuthPage) {
      router.replace("/login");
    }
  }, [user, loading, pathname, protect, router]);
}
