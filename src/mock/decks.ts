
export type MockDeck = { id: string; name: string; folderId?: string | null; updatedAt?: number };
export type MockFolder = { id: string; name: string; count?: number };

export const MOCK_FOLDERS: MockFolder[] = [
  { id: "f_science", name: "Science", count: 12 },
  { id: "f_lang", name: "Languages", count: 8 },
  { id: "f_hum", name: "Humanities", count: 15 },
];

export const MOCK_DECKS_RECENT: MockDeck[] = [
  { id: "d_bio", name: "Intro to Biology", folderId: "f_science", updatedAt: Date.now() },
  { id: "d_span", name: "Spanish Vocabulary", folderId: "f_lang", updatedAt: Date.now() - 1000 },
  { id: "d_hist", name: "World History", folderId: "f_hum", updatedAt: Date.now() - 2000 },
  { id: "d_org", name: "Organic Chemistry", folderId: "f_science", updatedAt: Date.now() - 3000 },
];

export const MOCK_DECKS_BY_FOLDER: Record<string, MockDeck[]> = {
  f_science: [
    { id: "d_bio", name: "Intro to Biology", folderId: "f_science" },
    { id: "d_phys", name: "Physics", folderId: "f_science" },
    { id: "d_astro", name: "Astronomy", folderId: "f_science" },
    { id: "d_org", name: "Organic Chemistry", folderId: "f_science" },
  ],
  f_lang: [{ id: "d_span", name: "Spanish Vocabulary", folderId: "f_lang" }],
  f_hum: [{ id: "d_hist", name: "World History", folderId: "f_hum" }],
};
