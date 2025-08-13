'use client';
'use client'
import { 
  getUserProgress as _getUserProgress,
  getTopics as _getTopics,
  getDeck,
  saveDeck,
  getDeckProgress,
  getUserDeckProgress,
  saveUserDeckProgress,
  getUserXpStats,
  getShopItems,
  purchaseShopItem,
  getSelectedCustomizations,
  saveSelectedCustomizations,
  getUserInventory,
  resetDeckPurchaseCounts,
  getDeckPurchaseCounts,
  logCardAttempt,
  purchasePowerUp
} from "../stitch/lib/firestore";

import type { GlobalProgress as AppGlobalProgress, SelectedCustomizations, BloomLevel, Flashcard } from "@/types";
import type { Topic as StitchTopic, UserDeckProgress } from "@/stitch/types";
import { onSnapshot, query, collection, where, doc, getDocs, getDoc , getDbStrict } from '@/lib/firebase.client';
import {  getDb, getDbStrict } from '@/lib/firebase.client'; // make sure this path is correct

/** Fix: typed wrapper so global always matches our app's type */
export async function getUserProgress(uid: string) {
  const p: any = await _getUserProgress(uid);
  const g = p?.global ?? {};

  const normalized: AppGlobalProgress = {
    level: Number(g.level ?? 0),
    xp: Number(g.xp ?? 0),
    xpToNext: Number(g.xpToNext ?? 0),
    total: typeof g.total === "number" ? g.total : 0,
    reviewed: typeof g.reviewed === "number" ? g.reviewed : 0,
    percent: typeof g.percent === "number" ? g.percent : 0,
  };

  return { ...p, global: normalized };
}

/** Typed getTopics wrapper */
export async function getTopics(uid: string): Promise<StitchTopic[]> {
  const topics = await _getTopics(uid);
  return (Array.isArray(topics) ? topics : []) as StitchTopic[];
}

/** Subscribe-style API for user customizations */
export function getUserCustomizations(
  uid: string,
  onSnap: (c: SelectedCustomizations | null) => void
): () => void {
  // FIX: Path was pointing to a document, so use doc() instead of collection()
  const docRef = doc(getDb(), "users", uid, "customizations", "selected");
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      onSnap(doc.data() as SelectedCustomizations);
    } else {
      onSnap(null);
    }
  });
}

/**
 * Fetches all cards for a specific deck, filtered by a specific Bloom's Level.
 * @param uid The user's ID.
 * @param deckId The deck's ID.
 * @param level The Bloom's Level to filter by.
 * @returns A promise that resolves to an array of Flashcard objects.
 */
export async function getCardsForDeckByBloomLevel(uid: string, deckId: string, level: BloomLevel): Promise<Flashcard[]> {
    const cardsQuery = query(
        collection(getDb(), 'userTopics', uid, 'decks', deckId, 'cards'),
        where('bloomLevel', '==', level)
    );
    const cardsSnap = await getDocs(cardsQuery);
    return cardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
}

/**
 * Fetches all cards for a specific deck.
 * @param uid The user's ID.
 * @param deckId The deck's ID.
 * @returns A promise that resolves to an array of all Flashcard objects in the deck.
 */
export async function getAllCardsForDeck(uid: string, deckId: string): Promise<Flashcard[]> {
    const cardsColRef = collection(getDb(), 'userTopics', uid, 'decks', deckId, 'cards');
    const cardsSnap = await getDocs(cardsColRef);
    return cardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
}


/**
 * Fetches a single card by its ID from within a deck's subcollection.
 * @param uid The user's ID.
 * @param deckId The deck's ID.
 * @param cardId The card's ID.
 * @returns A promise that resolves to the Flashcard object, or null if not found.
 */
export async function getCardById(uid: string, deckId: string, cardId: string): Promise<Flashcard | null> {
    const cardRef = doc(getDb(), 'userTopics', uid, 'decks', deckId, 'cards', cardId);
    const cardSnap = await getDoc(cardRef);
    if (cardSnap.exists()) {
        return { id: cardSnap.id, ...cardSnap.data() } as Flashcard;
    }
    return null;
}


// Re-export other helpers
export {
  getDeck,
  saveDeck,
  getDeckProgress,
  getUserDeckProgress,
  saveUserDeckProgress,
  getUserXpStats,
  getShopItems,
  purchaseShopItem,
  getSelectedCustomizations,
  saveSelectedCustomizations,
  getUserInventory,
  resetDeckPurchaseCounts,
  getDeckPurchaseCounts,
  logCardAttempt,
  purchasePowerUp
};

export type { UserDeckProgress };







