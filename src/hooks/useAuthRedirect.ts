// src/hooks/useAuthRedirect.ts
"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUserAuth } from "@/app/Providers/AuthProvider";

/**
 * Smart auth redirect:
 * - Never hijacks public pages (e.g. /about)
 * - Only auto-bounces signed-in users from *allowed* entry pages (default: "/")
 * - Still supports `protect` to send guests to /login on protected pages
 * - Respects ?returnTo=/some/path when redirecting signed-in users
 */
export function useAuthRedirect(options?: { protect?: boolean }) {
  const { protect = false } = options ?? {};
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  // Be defensive if provider import path differs in some envs
  const { user, loading } = (useUserAuth?.() as
    | { user: unknown; loading: boolean }
    | undefined) ?? { user: null, loading: false };

  useEffect(() => {
    if (loading || !pathname) return;

    // Pages where auto-redirect (signed-in -> /home) is allowed to fire
    const ALLOW_AUTO_REDIRECT_FROM = new Set<string>(["/"]); // add more if desired

    // Public pages that must never be hijacked
    const PUBLIC_PAGES = new Set<string>(["/about", "/pricing", "/help"]); // edit for your app

    const isAuthPage =
      pathname.startsWith("/login") || pathname.startsWith("/signup");

    // 1) If user is signed in and on auth pages, push them away
    if (user && isAuthPage) {
      const returnTo = search.get("returnTo");
      router.replace(returnTo || "/home");
      return;
    }

    // 2) If user is signed in, never hijack public pages
    if (user && PUBLIC_PAGES.has(pathname)) {
      return;
    }

    // 3) If user is signed in and on an allowed entry page, send them to home (or ?returnTo)
    if (user && ALLOW_AUTO_REDIRECT_FROM.has(pathname)) {
      const returnTo = search.get("returnTo");
      router.replace(returnTo || "/home");
      return;
    }

    // 4) If page is protected and user not signed in, send them to /login (but don't loop on auth pages)
    if (protect && !user && !isAuthPage) {
      const encoded = encodeURIComponent(pathname + (search?.toString() ? `?${search.toString()}` : ""));
      router.replace(`/login?returnTo=${encoded}`);
      return;
    }
  }, [user, loading, pathname, search, protect, router]);
}
