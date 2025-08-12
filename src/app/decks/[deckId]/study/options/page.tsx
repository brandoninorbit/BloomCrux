
import { redirect } from 'next/navigation';

// This page is deprecated and now just redirects to the main study options hub.
// The props signature is updated to match Next.js 15's expectations for this route type.
export default async function DeprecatedStudyOptionsPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  redirect(`/decks/${deckId}/study`);
}
