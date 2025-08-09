
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { Deck } from '@/types';
import Link from 'next/link';

// Mock data has been removed to avoid confusion.
// In a real implementation, this component would receive dynamic data.
const reviewDecks: any[] = [
  // {
  //   title: 'Mitosis & Meiosis',
  //   cardsDue: 32,
  //   status: 'Due Now',
  //   next: '2h 15m',
  //   colors: 'bg-red-50 border-red-500 text-red-600',
  // },
];

interface DueForReviewCardProps {
  decks: Deck[]; // We accept the decks prop for future dynamic use
}


export function DueForReviewCard({ decks }: DueForReviewCardProps) {
  // In a real implementation, you would process the `decks` prop
  // to calculate due times and populate this component.
  // For now, we use the static mock data.

  // This assumes the first deck is the one to study. A real implementation would be more complex.
  const deckToReviewId = decks.length > 0 ? (decks[0] as any).id : null;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Due for Review</CardTitle>
      </CardHeader>
      <CardContent>
        {reviewDecks.length > 0 ? (
            <div className="space-y-4">
            {reviewDecks.map((deck) => (
                <div key={deck.title} className={`flex items-center justify-between p-4 border-l-4 rounded-lg ${deck.colors.split(' ')[0]} ${deck.colors.split(' ')[1]}`}>
                <div>
                    <h3 className="font-semibold text-gray-800">{deck.title}</h3>
                    <p className="text-sm text-gray-600">{deck.cardsDue} cards due</p>
                </div>
                <div className="text-right">
                    <span className={`font-semibold ${deck.colors.split(' ')[2]}`}>{deck.status}</span>
                    <p className="text-xs text-gray-500">Next: {deck.next}</p>
                </div>
                </div>
            ))}
            </div>
        ) : (
            <p className="text-muted-foreground">You have items due for review. Start a session to see them!</p>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full mt-2" asChild disabled={!deckToReviewId}>
          <Link href={deckToReviewId ? `/decks/${deckToReviewId}/study/options` : '#'}>
            <span>Start Session</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
