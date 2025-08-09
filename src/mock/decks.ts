
import type { Deck as StitchDeck } from '@/stitch/types';

export type MockDeck = StitchDeck;
export type MockFolder = { id: string; name: string; count?: number; color: 'blue' | 'green' | 'yellow'; sets: number; };

export const MOCK_FOLDERS: MockFolder[] = [
  { id: "f_science", name: "Science", count: 12, color: "blue", sets: 12 },
  { id: "f_lang", name: "Languages", count: 8, color: "green", sets: 8 },
  { id: "f_hum", name: "Humanities", count: 15, color: "yellow", sets: 15 },
];

export const MOCK_DECKS_RECENT: MockDeck[] = [
  { id: "m1", title: "Intro to Biology", description: "Biology", cards: [] },
  { id: "m2", title: "Spanish Vocabulary", description: "Spanish", cards: [] },
  { id: "m3", title: "World History", description: "History", cards: [] },
  { id: "m4", title: "Organic Chemistry", description: "Chemistry", cards: [] },
  { id: "m5", title: "Algebra II", description: "Math", cards: [] },
  { id: "m6", title: "Anatomy", description: "Biology", cards: [] },
];

export const MOCK_DECKS_BY_FOLDER: Record<string, MockDeck[]> = {
  f_science: [
    { id: "d_bio", title: "Intro to Biology", description: "deck for bio", cards:[] },
    { id: "d_phys", title: "Physics", description: "deck for physics", cards:[] },
    { id: "d_astro", title: "Astronomy", description: "deck for astronomy", cards:[] },
    { id: "d_org", title: "Organic Chemistry", description: "deck for ochem", cards:[] },
  ],
  f_lang: [{ id: "d_span", title: "Spanish Vocabulary", description: "deck for spanish", cards:[] }],
  f_hum: [{ id: "d_hist", title: "World History", description: "deck for history", cards:[] }],
};
