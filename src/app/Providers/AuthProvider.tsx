"use client";

import { ReactNode } from "react";
import { AuthContextProvider, useUserAuth } from "@/context/AuthContext";

// Re-export hooks for any files importing from "@/ap./providers/AuthProvider"
export { useUserAuth };
export { useUserAuth as useAuth };

export default function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}


