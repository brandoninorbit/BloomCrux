
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PartyPopper } from 'lucide-react';

export function AllCaughtUpCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <PartyPopper className="h-12 w-12 text-primary" />
        <CardTitle className="text-xl font-bold">You're All Caught Up!</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">
          You have no items due for review right now. Start a new session to learn more cards!
        </p>
      </CardContent>
    </Card>
  );
}


