'use client';

import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function EmptyDeckState() {
  return (
    <Card className="w-full max-w-lg text-center shadow-lg">
      <CardHeader>
        <PlusCircle className="mx-auto h-16 w-16 text-muted-foreground" />
        <CardTitle className="font-headline text-2xl mt-4">Create Your First Deck</CardTitle>
        <CardDescription>
          It looks like you don't have any study decks yet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">
          Get started by creating a new deck of flashcards.
        </p>
        <Button asChild>
          <Link href="/decks">Create a Deck</Link>
        </Button>
      </CardContent>
    </Card>
  );
}


