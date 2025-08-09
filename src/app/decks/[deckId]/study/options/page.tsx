import { redirect } from 'next/navigation';

// This page is deprecated and now just redirects to the main study options hub.
export default function DeprecatedStudyOptionsPage({ params }: { params: { deckId: string } }) {
  const { deckId } = params;
  redirect(`/decks/${deckId}/study`);
}
