import { redirect } from 'next/navigation';

type PageProps = {
  params: {
    deckId: string;
  };
};

// This page is deprecated and now just redirects to the main study options hub.
export default function DeprecatedStudyOptionsPage({ params }: PageProps) {
  const { deckId } = params;
  redirect(`/decks/${deckId}/study`);
}
