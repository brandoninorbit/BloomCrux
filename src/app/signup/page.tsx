

import { SignupForm } from "@/components/auth/signup-form";
import Image from "next/image";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
      <div className="text-center mb-8">
         <h1 className="text-5xl font-bold tracking-wider text-primary font-headline flex items-center gap-4">
            <Image src="https://firebasestorage.googleapis.com/v0/b/bloomcrux.firebasestorage.app/o/BloomCrux%20logo.png?alt=media&token=d86c90af-2186-4d28-95ed-be594b54ed30" alt="BloomCrux Logo" width={96} height={96} />
            BloomCrux
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Create an account to start learning.
        </p>
      </div>
      <SignupForm />
    </main>
  );
}
