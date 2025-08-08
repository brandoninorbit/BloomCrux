"use client"

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PowerUpPanel } from '@/components/study/power-up-panel';
import { useState, useEffect } from 'react';

// This layout wraps all study modes
export default function StudyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { deckId: string };
}) {
  // Use state and effect to avoid hydration mismatch for randomized initial values
  const [progress, setProgress] = useState(0); 
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    setProgress(Math.floor(Math.random() * 80) + 10); // Random progress
    setTokens(Math.floor(Math.random() * 200) + 50); // Random tokens
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 gap-4">
          <Link href={`/app/decks`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
            <ChevronLeft size={18} />
            <span>End Session</span>
          </Link>
          <div className="flex items-center gap-3 w-full max-w-xs md:max-w-md">
            <Progress value={progress} className="w-full h-3" />
            <span className="text-sm font-semibold text-muted-foreground">{progress}%</span>
          </div>
          <div className="flex items-center justify-end gap-2 font-bold text-lg text-primary">
            <span>🏵️</span>
            <span className="hidden sm:inline">{tokens}</span>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        {children}
      </main>
      <PowerUpPanel tokens={tokens} />
    </div>
  );
}
