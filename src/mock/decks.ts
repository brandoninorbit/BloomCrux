
import type { Deck as StitchDeck, Flashcard } from '@/stitch/types';

export type MockDeck = StitchDeck;
export type MockFolder = { id: string; name: string; count?: number; color: 'blue' | 'green' | 'yellow'; sets: number; };

const mockMCQCard: Flashcard = {
  id: 'card-1',
  questionStem: "Which bond links amino acids in a polypeptide chain?",
  cardFormat: 'Standard MCQ',
  topic: 'Biology',
  subTopic: 'Macromolecules',
  bloomLevel: 'Remember',
  isStarred: true,
  tier1: {
    question: "Which bond links amino acids in a polypeptide chain?",
    options: ["Peptide bond", "Glycosidic bond", "Ester bond", "Hydrogen bond"],
    correctAnswerIndex: 0,
    distractorRationale: {
      "1": "Glycosidic bonds link monosaccharides.",
      "2": "Ester bonds are found in lipids.",
      "3": "Hydrogen bonds stabilize protein secondary structures but do not form the primary chain."
    }
  }
};

export const MOCK_FOLDERS: MockFolder[] = [
  { id: "f_science", name: "Science", count: 12, color: "blue", sets: 12 },
  { id: "f_lang", name: "Languages", count: 8, color: "green", sets: 8 },
  { id: "f_hum", name: "Humanities", count: 15, color: "yellow", sets: 15 },
];

export const MOCK_DECKS_RECENT: MockDeck[] = [
  { id: "m1", title: "Intro to Biology", description: "Biology", cards: [mockMCQCard] },
  { id: "m2", title: "Spanish Vocabulary", description: "Spanish", cards: [mockMCQCard] },
  { id: "m3", title: "World History", description: "History", cards: [mockMCQCard] },
  { id: "m4", title: "Organic Chemistry", description: "Chemistry", cards: [mockMCQCard] },
  { id: "m5", title: "Algebra II", description: "Math", cards: [mockMCQCard] },
  { id: "m6", title: "Anatomy", description: "Biology", cards: [mockMCQCard] },
];

export const MOCK_DECKS_BY_FOLDER: Record<string, MockDeck[]> = {
  f_science: [
    { id: "d_bio", title: "Intro to Biology", description: "deck for bio", cards:[mockMCQCard] },
    { id: "d_phys", title: "Physics", description: "deck for physics", cards:[mockMCQCard] },
    { id: "d_astro", title: "Astronomy", description: "deck for astronomy", cards:[mockMCQCard] },
    { id: "d_org", title: "Organic Chemistry", description: "deck for ochem", cards:[mockMCQCard] },
  ],
  f_lang: [{ id: "d_span", title: "Spanish Vocabulary", description: "deck for spanish", cards:[mockMCQCard] }],
  f_hum: [{ id: "d_hist", title: "World History", description: "deck for history", cards:[mockMCQCard] }],
};
