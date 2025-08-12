// src/components/TodaySessionCard.tsx
'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Flashcard } from '@/types';

async function getSessionDeck(): Promise<Flashcard[]> {
  // TODO: integrate spaced-repetition + interleaving logic
  return [];
}

export function TodaySessionCard() {
  const [loading, setLoading] = useState(false);
  const handleStart = async () => {
    setLoading(true);
    const deck = await getSessionDeck();
    console.log('Session deck:', deck);
    setLoading(false);
    // TODO: navigate to study page with `deck`
  };

  return (
    <Card className="p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Start 20-min Session</h2>
      <Button onClick={handleStart} disabled={loading}>
        {loading ? 'PreparingÃ¢â‚¬Â¦' : 'Begin Session'}
      </Button>
    </Card>
  );
}


