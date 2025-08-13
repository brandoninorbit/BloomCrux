'use client';
import type { Flashcard, GlobalProgress, UserXpStats, BloomLevel, BloomMastery } from '@/types';
import type { Timestamp } from "@/lib/firebase.client";

type StitchCard = {
  id: string | number;
  // ...other fields you actually have
};

export function toFlashcard(c: StitchCard): Flashcard {
  return {
    ...c,
    id: String(c.id),
  } as Flashcard;
}

export function toGlobalProgress(s: any): GlobalProgress {
  // Ensure required fields exist
  return {
    level: s.level ?? 0,
    xp: s.xp ?? 0,
    xpToNext: s.xpToNext ?? 0,
    total: s.total ?? 0,
    reviewed: s.reviewed ?? 0,
    percent: s.percent ?? 0,
  };
}

export function toUserXpStats(s: any): UserXpStats {
  // Convert Firestore Timestamp -> Date if your UserXpStats expects Date
  const tsToDate = (t: Date | Timestamp) =>
    (typeof (t as any)?.toDate === 'function') ? (t as Timestamp).toDate() : (t as Date);

  return {
    sessionXP: s.sessionXP ?? 0,
    dailyXP: s.dailyXP ?? 0,
    bonusVault: s.bonusVault ?? 0,
    commanderXP: s.commanderXP ?? 0,
    sessionStart: tsToDate(s.sessionStart ?? new Date()),
    lastDailyReset: tsToDate(s.lastDailyReset ?? new Date()),
    isXpBoosted: !!s.isXpBoosted,
  };
}

