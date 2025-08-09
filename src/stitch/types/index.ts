// Temporary shim to unify types during migration
export * from '@/types';

// Compat aliases during migration:
export type UserDeckProgress = import('@/types').DeckProgress;

// Minimal CardAttempt to satisfy all callers (adjust fields if you need more)
import type { BloomLevel } from '@/types';
export type CardAttempt = {
  deckId: string;
  cardId: string;          // <- normalize to string so UI is happy
  bloomLevel: BloomLevel;
  wasCorrect: boolean;
  timestamp: Date;         // UI side uses Date
};

// If your code imports StudyMode / RecallLevel, provide temporary unions
export type StudyMode = 'practice' | 'quest' | 'remix' | 'starred' | 'timed' | 'topic-trek' | 'level-up' | 'bloom-focus';
export type RecallLevel = 0 | 1 | 2 | 3 | 4 | 5;
