import type { DeckSummary, FolderSummary } from "@/types";

export async function getUserDecks(uid: string): Promise<DeckSummary[]> {
  // TODO: replace with Firestore; return [] if none
  return [];
}

export async function getUserFolders(uid: string): Promise<FolderSummary[]> {
  // TODO: replace with Firestore; return [] if none
  return [];
}
