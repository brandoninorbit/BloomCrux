






















import { collection, getDocs, query, where, addDoc, serverTimestamp, Timestamp, doc, setDoc, getDoc, runTransaction, writeBatch, increment, deleteDoc, onSnapshot, Unsubscribe, collectionGroup, orderBy, limit } from 'firebase/firestore';
import { getDb, getFirebaseAuth, getFirebaseStorage } from './firebase';
import type { Flashcard, CardAttempt, Topic, UserDeckProgress, UserPowerUps, Deck, BloomLevel, PowerUpType, PurchaseCounts, GlobalProgress, ShopItem, UserInventory, UserXpStats, UserCustomizations, SelectedCustomizations, UserSettings } from '../types';
import { GLOBAL_SHOP_ITEMS } from '@/lib/shop-items';
import { calculateXpForCorrectAnswer } from './xpCalculator';
import { getStreakBonus } from './xp';
import { toast } from '@/hooks/use-toast';
import { type User, updateProfile } from 'firebase/auth';
import { avatarFrames } from '@/config/avatarFrames';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Recursively removes keys with `undefined` values from an object or an array of objects.
 * This is necessary because Firestore does not support `undefined`.
 * @param obj The object or array to sanitize.
 * @returns The sanitized object or array.
 */
function sanitizeForFirestore<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForFirestore(item)) as any;
    }

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value !== undefined) {
                newObj[key] = sanitizeForFirestore(value);
            }
        }
    }
    return newObj as T;
}


/**
 * Fetches all topics and their decks for a given user.
 * This is optimized to NOT fetch the cards within each deck.
 * @param userId The ID of the user whose topics to fetch.
 * @returns A promise that resolves to an array of Topic objects.
 */
export async function getTopics(userId: string): Promise<Topic[]> {
    const db = getDb();
    const userTopicsDocRef = doc(getDb(), 'userTopics', userId);
    const docSnap = await getDoc(userTopicsDocRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.topics)) {
            const topics = data.topics as Topic[];
            // Ensure cards array is not present on decks
            return topics.map(topic => ({
                ...topic,
                decks: topic.decks.map(deck => {
                    const { cards, ...deckWithoutCards } = deck;
                    return { ...deckWithoutCards, cards: [] }; // FIX: add empty cards array
                })
            }));
        }
    }
    return [];
}

/**
 * Fetches a single deck with its cards for a given user.
 * @param userId The ID of the user.
 * @param deckId The ID of the deck to fetch.
 * @returns A promise that resolves to the Deck object, or null if not found.
 */
export async function getDeck(userId: string, deckId: string): Promise<Deck | null> {
    const db = getDb();
    const userTopicsDocRef = doc(getDb(), 'userTopics', userId);
    const docSnap = await getDoc(userTopicsDocRef);

    if (docSnap.exists()) {
        const topicsData = docSnap.data().topics || [];
        for (const topic of topicsData) {
            const foundDeck = topic.decks.find((d: Deck) => d.id === deckId);
            if (foundDeck) {
                // Fetch cards for the specific deck
                const cardsQuery = query(collection(getDb(), 'userTopics', userId, 'decks', deckId, 'cards'));
                const cardsSnap = await getDocs(cardsQuery);
                foundDeck.cards = cardsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Flashcard));
                return foundDeck;
            }
        }
    }
    return null; // Deck not found
}

/**
 * Saves a single, updated deck back into the user's topics structure.
 * @param userId The ID of the user.
 * @param updatedDeck The deck object with its changes.
 */
export async function saveDeck(userId: string, updatedDeck: Deck): Promise<void> {
    const db = getDb();
    const userTopicsDocRef = doc(getDb(), 'userTopics', userId);

    try {
        await runTransaction(db, async (transaction) => {
            const userTopicsDoc = await transaction.get(userTopicsDocRef);
            if (!userTopicsDoc.exists()) {
                throw new Error("User topics document not found.");
            }

            const topics = userTopicsDoc.data().topics as Topic[] || [];
            let deckFound = false;

            // Find and update the deck within the topics structure
            const newTopics = topics.map(topic => ({
                ...topic,
                decks: topic.decks.map(deck => {
                    if (deck.id === updatedDeck.id) {
                        deckFound = true;
                        // Return the updated deck, but without its cards property
                        const { cards, ...deckToSave } = updatedDeck;
                        return deckToSave;
                    }
                    return deck;
                })
            }));

            if (!deckFound) {
                // This case should ideally not happen if the UI flows correctly
                // but as a fallback, you could decide to add it to a default topic
                // or throw an error.
                throw new Error("Deck to update not found in user's topics.");
            }
            
            // Save the updated topics structure
            transaction.set(userTopicsDocRef, { topics: sanitizeForFirestore(newTopics) });
        });
    } catch (error) {
        console.error("Failed to save deck:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}


/**
 * Saves the entire topics array for a given user, after sanitizing it for Firestore.
 * This now saves decks WITHOUT their cards, as cards are managed in a subcollection.
 * @param userId The ID of the user.
 * @param topics The array of Topic objects to save.
 */
export async function saveTopics(userId: string, topics: Topic[]): Promise<void> {
    const db = getDb();
    const userTopicsDocRef = doc(getDb(), 'userTopics', userId);
    
    // Create a deep copy to avoid modifying the original state object
    const topicsToSave = JSON.parse(JSON.stringify(topics));

    // For each deck, save its cards to a subcollection and then remove them from the main object
    const batch = writeBatch(db);

    for (const topic of topicsToSave) {
        if (topic.decks) {
            for (const deck of topic.decks) {
                if (deck.cards && deck.cards.length > 0) {
                    for (const card of deck.cards) {
                        const { id, ...cardData } = card;
                        const cardRef = doc(getDb(), 'userTopics', userId, 'decks', deck.id, 'cards', String(id));
                        batch.set(cardRef, sanitizeForFirestore(cardData));
                    }
                }
                // Remove the cards array from the deck object before saving the main topics doc
                delete deck.cards;
            }
        }
    }
    
    // Save the topics structure (without cards)
    batch.set(userTopicsDocRef, { topics: sanitizeForFirestore(topicsToSave) });

    await batch.commit();
}


/**
 * Logs a user's attempt at a flashcard and updates XP and levels.
 * This is now an atomic transaction.
 * @param userId The user's ID.
 * @param attemptData The data for the card attempt.
 * @returns An object containing deck mastery status and awarded tokens, along with XP breakdown.
 */
export async function logCardAttempt(
    userId: string,
    attemptData: Omit<CardAttempt, 'id' | 'userId'>
): Promise<{ deckMastered: boolean, awardedTokens: number, xpBreakdown: { base: number, streakBonus: number, weakCardBonus: number, recencyBonus: number } }> {
  const db = getDb();
  const TOKENS_PER_CORRECT_ANSWER = 5;
  const DECK_MASTERY_BONUS = 100;
  const MASTERY_THRESHOLD = 0.8;
  const SESSION_CAP = 150;
  const DAILY_CAP = 1000;

  let awardedTokens = 0;
  let deckMastered = false;
  const xpBreakdown = { base: 0, streakBonus: 0, weakCardBonus: 0, recencyBonus: 0 };
  let newCommanderLevel = -1;
  let unlockedFrameName: string | null = null;

  try {
    await runTransaction(db, async (transaction) => {
      const { deckId, cardId, bloomLevel } = attemptData;
      
      const userTopicsDocRef = doc(getDb(), 'userTopics', userId);
      const userSettingsDocRef = doc(getDb(), 'users', userId);
      const deckProgressDocRef = doc(getDb(), 'userProgress', userId, 'decks', deckId);
      const globalProgressDocRef = doc(getDb(), 'userProgress', userId);
      const xpStatsDocRef = doc(getDb(), 'users', userId, 'xpStats', 'stats');
      const cardsInDeckQuery = query(collection(getDb(), 'userTopics', userId, 'decks', deckId, 'cards'));
      const customizationsDocRef = doc(getDb(), 'users', userId, 'customizations', 'unlocked');
      const selectedCustomizationsDocRef = doc(getDb(), 'users', userId, 'customizations', 'selected');

      const cardAttemptsQuery = query(
        collection(getDb(), 'cardAttempts'),
        where("userId", "==", userId),
        where("cardId", "==", cardId),
        orderBy("timestamp", "desc")
      );
      
      const [
        userTopicsDoc,
        userSettingsDoc,
        deckProgressDoc,
        globalProgressDoc,
        cardAttemptsSnapshot,
        cardsInDeckSnapshot,
        xpStatsDoc,
        customizationsDoc,
        selectedCustomizationsDoc,
      ] = await Promise.all([
        transaction.get(userTopicsDocRef),
        transaction.get(userSettingsDocRef),
        transaction.get(deckProgressDocRef),
        transaction.get(globalProgressDocRef),
        getDocs(cardAttemptsQuery),
        getDocs(cardsInDeckQuery),
        transaction.get(xpStatsDocRef),
        transaction.get(customizationsDocRef),
        transaction.get(selectedCustomizationsDocRef)
      ]);

      let deckProgress = (deckProgressDoc.exists() ? deckProgressDoc.data() : { level: 1, xp: 0, xpToNext: 100, lastCardIndex: 0, mode: 'quest', streak: 0 }) as UserDeckProgress;
      let globalProgress = (globalProgressDoc.exists() ? globalProgressDoc.data()?.global : { level: 1, xp: 0, xpToNext: 500 }) as GlobalProgress;
      let xpStats = (xpStatsDoc.exists() ? xpStatsDoc.data() : { sessionXP: 0, dailyXP: 0, bonusVault: 0, commanderXP: 0, isXpBoosted: false }) as unknown as UserXpStats;
      let customizations = (customizationsDoc.exists() ? customizationsDoc.data() : { avatarFrames: [] }) as UserCustomizations;


      const newAttemptRef = doc(collection(getDb(), 'cardAttempts'));
      transaction.set(newAttemptRef, { ...attemptData, userId, timestamp: serverTimestamp() });

      if (attemptData.wasCorrect) {
        awardedTokens = TOKENS_PER_CORRECT_ANSWER;
        const previousCardAttempts = cardAttemptsSnapshot.docs.map(d => ({...d.data(), timestamp: (d.data().timestamp as Timestamp).toDate()})) as CardAttempt[];
        
        const { base, weakCardBonus, recencyBonus } = calculateXpForCorrectAnswer(bloomLevel, previousCardAttempts);
        const newStreak = (deckProgress.streak || 0) + 1;
        const streakBonus = getStreakBonus(newStreak);
        deckProgress.streak = newStreak;
        
        xpBreakdown.base = base;
        xpBreakdown.weakCardBonus = weakCardBonus;
        xpBreakdown.recencyBonus = recencyBonus;
        xpBreakdown.streakBonus = streakBonus;

        let rawXpGained = Math.max(1, base + weakCardBonus + recencyBonus + streakBonus);

        // Apply XP Booster if active
        if (xpStats.isXpBoosted) {
            rawXpGained *= 2;
        }
        
        // --- Capping Logic ---
        let sessionAward;
        if (xpStats.sessionXP < SESSION_CAP) {
            const available = SESSION_CAP - xpStats.sessionXP;
            const overflow = Math.max(0, rawXpGained - available);
            sessionAward = Math.min(rawXpGained, available) + Math.floor(overflow / 2);
        } else {
            sessionAward = Math.floor(rawXpGained / 2);
        }
        xpStats.sessionXP += rawXpGained;

        let dailyAward;
        if (xpStats.dailyXP < DAILY_CAP) {
            const availDaily = DAILY_CAP - xpStats.dailyXP;
            dailyAward = Math.min(sessionAward, availDaily);
            xpStats.bonusVault += sessionAward - dailyAward;
        } else {
            dailyAward = 0;
            xpStats.bonusVault += sessionAward;
        }
        xpStats.dailyXP += dailyAward;

        deckProgress.xp += dailyAward;

        let deckJustLeveledUp = false;
        if (deckProgress.xp >= deckProgress.xpToNext) {
            deckJustLeveledUp = true;
            deckProgress.level += 1;
            deckProgress.xp -= deckProgress.xpToNext;
            deckProgress.xpToNext = Math.floor(deckProgress.xpToNext * 1.5);
        }
        
        let commanderAward = dailyAward;
        if (deckJustLeveledUp) {
            const threshold = deckProgress.xpToNext;
            commanderAward += Math.floor(threshold * 0.75);
        }
        globalProgress.xp += commanderAward;

        const originalLevel = globalProgress.level;
        if (globalProgress.xp >= globalProgress.xpToNext) {
            globalProgress.level += 1;
            globalProgress.xp -= globalProgress.xpToNext;
            globalProgress.xpToNext = Math.floor(globalProgress.xpToNext * 2);
            newCommanderLevel = globalProgress.level; // Store for toast notification

            // Check for avatar frame unlock
            const newlyUnlockedFrame = Object.entries(avatarFrames).find(
              ([key, frame]) => frame.unlockLevel === newCommanderLevel && !customizations.avatarFrames.includes(key)
            );
            
            if (newlyUnlockedFrame) {
              const [key, frameData] = newlyUnlockedFrame;
              customizations.avatarFrames.push(key);
              transaction.set(customizationsDocRef, customizations);
              transaction.set(selectedCustomizationsDocRef, { activeAvatarFrame: key }, { merge: true });
              unlockedFrameName = frameData.name;
            }


            // Check for XP Booster unlock
            if (globalProgress.level > originalLevel && globalProgress.level % 5 === 0) {
                xpStats.isXpBoosted = true;
            }
        }
        xpStats.commanderXP = globalProgress.xp;

        const topics: Topic[] = userTopicsDoc.exists() ? userTopicsDoc.data().topics || [] : [];
        let targetDeck: Deck | null = null;
        let targetTopicIndex = -1;
        let targetDeckIndex = -1;
        for (let i = 0; i < topics.length; i++) {
          const deckIdx = topics[i].decks.findIndex(d => d.id === deckId);
          if (deckIdx !== -1) {
            targetDeck = topics[i].decks[deckIdx];
            targetTopicIndex = i;
            targetDeckIndex = deckIdx;
            break;
          }
        }
        
        if (targetDeck && !targetDeck.isMastered && deckJustLeveledUp) {
          const deckAttemptsQuery = query(collection(getDb(), 'cardAttempts'), where("userId", "==", userId), where("deckId", "==", deckId));
          const allDeckAttemptsSnapshot = await getDocs(deckAttemptsQuery);
          const allAttempts: CardAttempt[] = allDeckAttemptsSnapshot.docs.map(d => d.data() as CardAttempt);
          allAttempts.push({ ...attemptData, userId, timestamp: new Date() } as CardAttempt);
          
          const bloomMastery: { [key in BloomLevel]?: { correct: number, total: number } } = {};
          const deckCards = cardsInDeckSnapshot.docs.map(d => d.data() as Flashcard);
          const requiredLevelsForDeck = new Set(deckCards.map(c => c.bloomLevel));

          allAttempts.forEach(attempt => {
            if (requiredLevelsForDeck.has(attempt.bloomLevel)) {
                 if (!bloomMastery[attempt.bloomLevel]) bloomMastery[attempt.bloomLevel] = { correct: 0, total: 0 };
                 const mastery = bloomMastery[attempt.bloomLevel]!;
                 mastery.total++;
                 if (attempt.wasCorrect) mastery.correct++;
            }
          });
          
          const masteredLevels = Array.from(requiredLevelsForDeck).filter(level => {
            const bm = bloomMastery[level as BloomLevel];
            return bm && bm.total > 0 && (bm.correct / bm.total) >= MASTERY_THRESHOLD;
          });

          if (requiredLevelsForDeck.size > 0 && masteredLevels.length === requiredLevelsForDeck.size) {
            deckMastered = true;
            awardedTokens += DECK_MASTERY_BONUS;
            topics[targetTopicIndex].decks[targetDeckIndex].isMastered = true;
            transaction.set(userTopicsDocRef, { topics: sanitizeForFirestore(topics) });
          }
        }
        
        if (userSettingsDoc.exists()) {
          transaction.update(userSettingsDocRef, { tokens: increment(awardedTokens) });
        } else {
          transaction.set(userSettingsDocRef, { tokens: awardedTokens });
        }
      } else {
        deckProgress.streak = 0;
      }

      transaction.set(deckProgressDocRef, sanitizeForFirestore(deckProgress));
      transaction.set(globalProgressDocRef, { global: sanitizeForFirestore(globalProgress) }, { merge: true });
      transaction.set(xpStatsDocRef, sanitizeForFirestore(xpStats), { merge: true });

    });

    if (unlockedFrameName) {
      toast({
          title: `✨ Avatar Frame Unlocked!`,
          description: `You've unlocked the "${unlockedFrameName}" frame. It's been automatically equipped.`,
          duration: 6000
      });
    }

    if (newCommanderLevel > 0) {
        toast({
            title: `⭐ XP Booster Unlocked!`,
            description: `You reached Commander Level ${newCommanderLevel}! Your next session's XP gains will be doubled.`,
            duration: 6000
        });
    }

    return { deckMastered, awardedTokens, xpBreakdown };
  } catch (error) {
    console.error("Firestore transaction for card attempt failed:", error);
    throw error;
  }
}


/**
 * Fetches all card attempts for a given user to calculate progress.
 * @param userId The ID of the user whose attempts to fetch.
 * @returns A promise that resolves to an array of CardAttempt objects.
 */
export async function getDeckProgress(userId: string): Promise<CardAttempt[]> {
  const db = getDb();
  const attemptsRef = collection(getDb(), "cardAttempts");
  const q = query(attemptsRef, where("userId", "==", userId));
  
  const querySnapshot = await getDocs(q);
  
  const attempts: CardAttempt[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    attempts.push({
      id: doc.id,
      ...(data as Omit<CardAttempt, 'id' | 'timestamp'>),
      timestamp: (data.timestamp as Timestamp).toDate(),
    } as CardAttempt);
  });
  
  return attempts;
}


/**
 * Retrieves a user's progress for a specific deck.
 * @param userId The ID of the user.
 * @param deckId The ID of the deck.
 * @returns The user's progress for the deck, or null if not found.
 */
export async function getUserDeckProgress(userId: string, deckId: string): Promise<UserDeckProgress | null> {
    const db = getDb();
    const progressDocRef = doc(getDb(), 'userProgress', userId, 'decks', deckId);
    const docSnap = await getDoc(progressDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Provide default values for new XP fields if they don't exist
        return {
          lastCardIndex: data.lastCardIndex || 0,
          mode: data.mode || 'quest',
          randomOrder: data.randomOrder || [],
          level: data.level || 1,
          xp: data.xp || 0,
          xpToNext: data.xpToNext || 100,
          streak: data.streak || 0,
        };
    }
    return { level: 1, xp: 0, xpToNext: 100, lastCardIndex: 0, mode: 'quest', streak: 0 }; // Return default if no doc
}

/**
 * Retrieves all deck progress and global progress for a user.
 * @param userId The ID of the user.
 * @returns An object containing global progress and a map of deck-specific progress.
 */
export async function getUserProgress(userId: string): Promise<{ global: GlobalProgress, decks: { [deckId: string]: UserDeckProgress & Pick<Deck, 'title' | 'isMastered' | 'totalCards' | 'deckName'> } }> {
    const db = getDb();
    const userProgressRef = doc(getDb(), 'userProgress', userId);
    const decksProgressColRef = collection(getDb(), 'userProgress', userId, 'decks');
    const userTopicsDocRef = doc(getDb(), 'userTopics', userId);

    const [globalSnap, decksSnap, topicsSnap] = await Promise.all([
        getDoc(userProgressRef),
        getDocs(decksProgressColRef),
        getDoc(userTopicsDocRef)
    ]);

    const global = globalSnap.exists() 
        ? (globalSnap.data().global || { level: 1, xp: 0, xpToNext: 500 }) 
        : { level: 1, xp: 0, xpToNext: 500 };
    
    const topicsData = topicsSnap.exists() ? (topicsSnap.data().topics || []) : [];
    const deckInfoMap: { [id: string]: Pick<Deck, 'title' | 'isMastered' | 'cards'> } = {};
    topicsData.forEach((topic: Topic) => {
        topic.decks.forEach((deck: Deck) => {
            deckInfoMap[deck.id] = { title: deck.title, isMastered: deck.isMastered || false, cards: deck.cards || [] };
        });
    });

    const decks: { [deckId: string]: any } = {};
    decksSnap.forEach(doc => {
        const deckId = doc.id;
        const deckInfo = deckInfoMap[deckId];
        decks[deckId] = {
            ...doc.data(),
            deckName: deckInfo?.title || `Deck ${deckId}`,
            isMastered: deckInfo?.isMastered || false,
            totalCards: deckInfo?.cards.length || 0,
        } as UserDeckProgress;
    });

    return { global, decks };
}


/**
 * Saves a user's progress for a specific deck.
 * @param userId The ID of the user.
 * @param deckId The ID of the deck.
 * @param progress The user's progress data for the deck.
 */
export async function saveUserDeckProgress(userId: string, deckId: string, progress: Partial<UserDeckProgress>): Promise<void> {
    const db = getDb();
    const progressDocRef = doc(getDb(), 'userProgress', userId, 'decks', deckId);
    const sanitizedProgress = sanitizeForFirestore(progress);
    await setDoc(progressDocRef, sanitizedProgress, { merge: true });
}

/**
 * Retrieves a user's XP stats (session, daily, etc.).
 * @param userId The ID of the user.
 * @returns A promise resolving to the user's XP stats, or null.
 */
export async function getUserXpStats(userId: string): Promise<UserXpStats | null> {
    const db = getDb();
    const statsDocRef = doc(getDb(), 'users', userId, 'xpStats', 'stats'); // Use a consistent doc ID
    const docSnap = await getDoc(statsDocRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
        ...data,
        sessionStart: data.sessionStart ? (data.sessionStart as Timestamp).toDate() : new Date(),
        lastDailyReset: data.lastDailyReset ? (data.lastDailyReset as Timestamp).toDate() : new Date(0),
    } as unknown as UserXpStats;
}

/**
 * Saves a user's XP stats.
 * @param userId The ID of the user.
 * @param stats The XP stats data to save.
 */
export async function saveUserXpStats(userId: string, stats: Partial<UserXpStats>): Promise<void> {
    const db = getDb();
    const statsDocRef = doc(getDb(), 'users', userId, 'xpStats', 'stats');
    const sanitizedStats = sanitizeForFirestore(stats);
    await setDoc(statsDocRef, sanitizedStats, { merge: true });
}


/**
 * Gets the number of times a specific power-up has been purchased for a given deck.
 * @param uid The user ID.
 * @param deckId The deck ID.
 * @returns A promise that resolves to an object with counts for all power-up types.
 */
export async function getDeckPurchaseCounts(uid: string, deckId: string): Promise<PurchaseCounts> {
    const db = getDb();
    const counts: PurchaseCounts = { 'hint': 0, 'retry': 0, 'fifty-fifty': 0, 'time': 0, 'focus': 0, 'unlock': 0 };
    const powerUpsCollectionRef = collection(getDb(), 'users', uid, 'purchases', deckId, 'powerUps');
    
    try {
        const querySnapshot = await getDocs(powerUpsCollectionRef);
        querySnapshot.forEach(docSnap => {
            counts[docSnap.id as PowerUpType] = docSnap.data().count || 0;
        });
        return counts;
    } catch (e) {
        console.error("Could not fetch purchase counts", e);
        return counts; // Return default counts on error
    }
}



/**
 * Atomically deducts tokens for a power-up and increments the purchase count for that deck.
 * @param userId The user's ID.
 * @param deckId The deck's ID.
 * @param powerUp The type of power-up being purchased.
 * @param cost The cost of the power-up.
 */
export async function purchasePowerUp(userId: string, deckId: string, powerUp: PowerUpType, cost: number): Promise<void> {
    const db = getDb();
    const userSettingsDocRef = doc(getDb(), 'users', userId);
    const purchaseDocRef = doc(getDb(), 'users', userId, 'purchases', deckId, 'powerUps', powerUp);

    try {
        await runTransaction(db, async (transaction) => {
            const userSettingsDoc = await transaction.get(userSettingsDocRef);

            if (!userSettingsDoc.exists()) {
                throw new Error("User settings not found.");
            }

            const currentTokens = userSettingsDoc.data().tokens || 0;
            if (currentTokens < cost) {
                throw new Error("Insufficient tokens.");
            }

            // 1. Deduct tokens
            transaction.update(userSettingsDocRef, { tokens: currentTokens - cost });

            // 2. Increment purchase count
            const purchaseDoc = await transaction.get(purchaseDocRef);
            if (purchaseDoc.exists()) {
                transaction.update(purchaseDocRef, { count: increment(1) });
            } else {
                transaction.set(purchaseDocRef, { count: 1 });
            }
        });
    } catch (error) {
        console.error("Power-up purchase transaction failed:", error);
        throw error; // Re-throw to be handled by the calling UI
    }
}

/**
 * Deletes all power-up purchase count documents for a specific deck, effectively resetting prices.
 * @param userId The user ID.
 * @param deckId The deck ID to reset.
 */
export async function resetDeckPurchaseCounts(userId: string, deckId: string): Promise<void> {
    const db = getDb();
    const powerUpsCollectionRef = collection(getDb(), 'users', userId, 'purchases', deckId, 'powerUps');
    
    try {
        const querySnapshot = await getDocs(powerUpsCollectionRef);
        if (querySnapshot.empty) {
            return; // Nothing to delete
        }

        const batch = writeBatch(db);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    } catch (error) {
        console.error("Failed to reset purchase counts for deck:", deckId, error);
        throw error;
    }
}

/**
 * Simulates fetching shop items from Firestore.
 * First tries to fetch deck-specific items, then falls back to global items.
 * @param deckId Optional ID of the deck to fetch specific items for.
 * @returns A promise that resolves to an array of ShopItem objects.
 */
export async function getShopItems(deckId?: string): Promise<ShopItem[]> {
    const db = getDb();
    
    if (deckId) {
        // In a real app, you would fetch from a subcollection like:
        // const itemsRef = collection(getDb(), 'decks', deckId, 'shopItems');
        // const snapshot = await getDocs(itemsRef);
        // if (!snapshot.empty) {
        //     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopItem));
        // }
        // For this example, we'll assume deck-specific shops are not yet implemented
        // and immediately fall back to the global shop.
    }
    
    // Fallback to global items
    // In a real app, you would fetch from:
    // const globalItemsRef = collection(getDb(), 'shopItems', 'global', 'items');
    // For this example, we return a hardcoded list.
    return Promise.resolve(GLOBAL_SHOP_ITEMS);
}


/**
 * Fetches the user's inventory of purchased shop items.
 * @param userId The ID of the user.
 * @param onUpdate Optional callback for real-time updates on inventory changes.
 * @returns A promise resolving to the inventory or an Unsubscribe function for the listener.
 */
export function getUserInventory(userId: string, onUpdate?: (inventory: UserInventory) => void): Promise<UserInventory> | Unsubscribe {
    const db = getDb();
    const inventoryCollectionRef = collection(getDb(), 'users', userId, 'inventory');

    const processSnapshot = (snapshot: any) => {
        const inventory: UserInventory = {};
        snapshot.forEach((doc: any) => {
            inventory[doc.id] = doc.data().count || 0;
        });
        return inventory;
    };

    if (onUpdate) {
        return onSnapshot(inventoryCollectionRef, (snapshot) => {
            onUpdate(processSnapshot(snapshot));
        }, (error) => {
            console.error("Error listening to inventory:", error);
        });
    } else {
        return new Promise(async (resolve, reject) => {
            try {
                const snapshot = await getDocs(inventoryCollectionRef);
                resolve(processSnapshot(snapshot));
            } catch (error) {
                reject(error);
            }
        });
    }
}


/**
 * Atomically deducts tokens for a shop item and increments the item count in the user's inventory.
 * @param userId The user's ID.
 * @param item The shop item being purchased.
 */
export async function purchaseShopItem(userId: string, item: ShopItem): Promise<void> {
    const db = getDb();
    const { id: itemId, cost } = item;
    
    const userSettingsDocRef = doc(getDb(), 'users', userId);
    const inventoryItemRef = doc(getDb(), 'users', userId, 'inventory', itemId);

    try {
        await runTransaction(db, async (transaction) => {
            const userSettingsDoc = await transaction.get(userSettingsDocRef);
            
            if (!userSettingsDoc.exists()) {
                throw new Error("User data not found. Cannot complete purchase.");
            }
            
            const currentTokens = userSettingsDoc.data().tokens || 0;
            if (currentTokens < cost) {
                throw new Error("Insufficient tokens.");
            }

            transaction.update(userSettingsDocRef, { tokens: increment(-cost) });

            transaction.set(inventoryItemRef, { 
                count: increment(1),
                lastPurchased: serverTimestamp()
            }, { merge: true });
        });
    } catch (error) {
        console.error(`Transaction for purchasing item ${itemId} failed:`, error);
        throw error;
    }
}


/**
 * Fetches the list of all customizations a user has unlocked.
 * @param userId The user's ID.
 * @returns A promise resolving to the user's customizations.
 */
export async function getUserCustomizations(userId: string): Promise<UserCustomizations> {
    const db = getDb();
    const docRef = doc(getDb(), 'users', userId, 'customizations', 'unlocked');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserCustomizations;
    }
    return { avatarFrames: [], deckCovers: [], badges: [] }; // Default empty state
}

/**
 * Saves the user's entire collection of unlocked customizations.
 * @param userId The user's ID.
 * @param customizations The full UserCustomizations object to save.
 */
export async function saveUserCustomizations(userId: string, customizations: UserCustomizations): Promise<void> {
    const db = getDb();
    const docRef = doc(getDb(), 'users', userId, 'customizations', 'unlocked');
    await setDoc(docRef, sanitizeForFirestore(customizations));
}

/**
 * Fetches the user's currently selected/active customizations.
 * @param userId The user's ID.
 * @returns A promise resolving to the user's selected customizations.
 */
export async function getSelectedCustomizations(userId: string): Promise<SelectedCustomizations> {
    const db = getDb();
    const docRef = doc(getDb(), 'users', userId, 'customizations', 'selected');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as SelectedCustomizations;
    }
    // Default state if nothing has been selected yet
    return { activeAvatarFrame: 'default', activeDeckCovers: {}, activeBadge: 'default' }; 
}

/**
 * Saves the user's selected/active customizations.
 * @param userId The user's ID.
 * @param selections The SelectedCustomizations object to save.
 */
export async function saveSelectedCustomizations(userId: string, selections: Partial<SelectedCustomizations>): Promise<void> {
    const db = getDb();
    const docRef = doc(getDb(), 'users', userId, 'customizations', 'selected');
    await setDoc(docRef, sanitizeForFirestore(selections), { merge: true });
}

    


    