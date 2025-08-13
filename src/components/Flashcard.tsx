'use client';
import { useState } from 'react';
import type { Flashcard as FlashcardType, TwoTierMCQCard, TextCard, CodeCard } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { CodeSnippet } from './CodeSnippet';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FlashcardProps {
  card: FlashcardType;
  isFlipped: boolean;
  onFlip: () => void;
}

const renderContent = (content: string, card: FlashcardType) => {
    if (card.cardFormat === 'code' && 'back' in card) {
      return <CodeSnippet code={String((card as any).back ?? "")} />;
    }
    return <p className="text-2xl font-semibold text-center text-foreground">{content}</p>;
};

const renderCardFront = (card: FlashcardType) => {
    switch (card.cardFormat) {
        case 'Two-Tier MCQ':
            return <p className="text-2xl font-semibold text-center text-foreground">{card.questionStem}</p>;
        case 'text':
        case 'code':
            return <p className="text-2xl font-semibold text-center text-foreground">{card.front}</p>;
        default:
            return <p className="text-2xl font-semibold text-center text-foreground">Unsupported card format</p>;
    }
}

const renderCardBack = (card: FlashcardType) => {
    switch (card.cardFormat) {
        case 'Two-Tier MCQ':
            return (
                <div className="text-center">
                    <p className="text-lg font-bold">Answer (Tier 1):</p>
                    <p className="text-xl mb-4">{card.tier1.options[card.tier1.correctAnswerIndex]}</p>
                    <p className="text-lg font-bold">Explanation (Tier 2):</p>
                    <p className="text-xl">{card.tier2.options[card.tier2.correctAnswerIndex]}</p>
                </div>
            );
        case 'text':
             return <p className="text-2xl font-semibold text-center text-foreground">{card.back}</p>;
        case 'code':
            return <CodeSnippet code={String((card as any).back ?? "")} />;
        default:
            return <p className="text-2xl font-semibold text-center text-foreground">Unsupported card format</p>;
    }
}


export function Flashcard({ card, isFlipped, onFlip }: FlashcardProps) {

  return (
    <div className="w-full max-w-4xl h-64 [perspective:1000px]" onClick={onFlip}>
      <div
        className={cn('relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]', {
          '[transform:rotateY(180deg)]': isFlipped,
        })}
      >
        {/* Front of card */}
        <div className="absolute w-full h-full [backface-visibility:hidden] rounded-lg flex flex-col justify-center items-center p-6 bg-card shadow-lg cursor-pointer">
           {renderCardFront(card)}
        </div>

        {/* Back of card */}
        <div className="absolute w-full h-full [backface-visibility:hidden] rounded-lg flex flex-col justify-center items-center p-6 bg-accent shadow-lg [transform:rotateY(180deg)] cursor-pointer">
           {renderCardBack(card)}
           {card.cardFormat === 'text' && (
              <Image 
                src="https://placehold.co/300x200.png"
                alt="Memory aid image"
                width={300}
                height={200}
                className="mt-4 rounded-lg max-h-32 w-auto"
                data-ai-hint="historical figure"
              />
           )}
        </div>
      </div>
    </div>
  );
}





