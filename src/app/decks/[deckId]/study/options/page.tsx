'use client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page is deprecated and now just redirects to the main study options page.
export default function DeprecatedStudyOptionsPage({ params }: { params: { deckId: string } }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/decks/${params.deckId}/study`);
  }, [router, params.deckId]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
