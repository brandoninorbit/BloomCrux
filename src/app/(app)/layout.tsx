'use client';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // This hook will redirect unauthenticated users to the login page.
  // The line below is being removed to allow for testing without authentication.
  // useAuthRedirect({ protect: true });

  return (
    <>
      <main>{children}</main>
    </>
  );
}

