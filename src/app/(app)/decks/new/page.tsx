"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function NewDeckPage() {
  const router = useRouter();
  const { user, loading } = useUserAuth();

  useEffect(() => {
    // A new deck is just an unsaved deck. The edit page handles creation on save.
    // We just need a unique ID to start with.
    if (!loading) {
        // Only redirect if we're done loading auth state.
        // This prevents a race condition where a logged-out user might be
        // briefly redirected before the auth hook sends them to /login.
        const tempId = `new_${Date.now()}`;
        router.replace(`/decks/${tempId}/edit`);
    }
  }, [router, user, loading]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground">Preparing your new deck...</p>
      </div>
    </div>
  );
}
