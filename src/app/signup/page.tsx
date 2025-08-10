// src/app/signup/page.tsx
import { Suspense } from "react";
import { SignupScreen } from "./screen.client";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupScreen />
    </Suspense>
  );
}
