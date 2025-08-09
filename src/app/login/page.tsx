"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";

export default function LoginPage() {
  useAuthRedirect(); // ✅ no args - default behavior redirects authed users to /home

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
      <div className="text-center mb-8">
         <h1 className="text-5xl font-bold tracking-wider text-primary font-headline flex items-center gap-4">
            <Image src="https://firebasestorage.googleapis.com/v0/b/bloomcrux.firebasestorage.app/o/BloomCrux%20logo.png?alt=media&token=d86c90af-2186-4d28-95ed-be594b54ed30" alt="BloomCrux Logo" width={96} height={96} />
            BloomCrux
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Unlock your learning potential.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
