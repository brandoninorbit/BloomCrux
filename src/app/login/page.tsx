// src/app/login/page.tsx
import { Suspense } from "react";
import { LoginScreen } from "./screen.client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
