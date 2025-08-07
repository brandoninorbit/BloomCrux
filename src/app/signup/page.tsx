
import { SignupForm } from "@/components/auth/signup-form";
import { ShieldCheck } from "lucide-react";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
      <div className="text-center mb-8">
         <h1 className="text-5xl font-bold tracking-wider text-primary font-headline">
            <ShieldCheck className="inline-block h-12 w-12 mr-2" />
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
