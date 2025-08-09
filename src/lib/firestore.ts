import { 
  getUserProgress as _getUserProgress,
  getTopics as _getTopics,
  getDeck,
  getDeckProgress,
  getUserDeckProgress,
  saveUserDeckProgress,
  getUserXpStats,
  getShopItems,
  purchaseShopItem,
  getSelectedCustomizations,
  saveSelectedCustomizations,
  getUserInventory,
  uploadProfilePhotoAndUpdateAuth,
  resetDeckPurchaseCounts,
  getDeckPurchaseCounts,
  logCardAttempt,
  purchasePowerUp
} from "../stitch/lib/firestore";

import type { GlobalProgress as AppGlobalProgress, SelectedCustomizations } from "@/types";
import type { Topic as StitchTopic, UserDeckProgress } from "@/stitch/types";
import { onSnapshot, query, collection, where } from "firebase/firestore";
import { db } from "@/lib/firebase"; // make sure this path is correct

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
  const q = query(
    collection(db, "customizations"), // change this if your collection name is different
    where("uid", "==", uid)
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs[0]?.data() ?? null;
    onSnap(data as SelectedCustomizations | null);
  });
}

// Re-export other helpers
export {
  getDeck,
  getDeckProgress,
  getUserDeckProgress,
  saveUserDeckProgress,
  getUserXpStats,
  getShopItems,
  purchaseShopItem,
  getSelectedCustomizations,
  saveSelectedCustomizations,
  getUserInventory,
  uploadProfilePhotoAndUpdateAuth,
  resetDeckPurchaseCounts,
  getDeckPurchaseCounts,
  logCardAttempt,
  purchasePowerUp
};

export type { UserDeckProgress };
