// src/app/signup/screen.client.tsx
"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { SignupForm } from "@/components/auth/signup-form";

export function SignupScreen() {
  useAuthRedirect();
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-4">Create an account</h1>
        <SignupForm />
      </div>
    </main>
  );
}
