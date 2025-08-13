"use client";

import AuthProvider from "./Providers/AuthProvider.client";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
