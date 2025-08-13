# Firestore Listener & Guard Audit
Date: 2025-08-12T18:57:03

## onSnapshot / snapshot usage

### C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\decks\DecksClient.tsx
    const q = query(
      collection(db, "users", user.uid, "folders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const next: FolderSummary[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name ?? "Untitled",

### C:\Users\brand\BloomCruxfixevenmoreshissss\src\hooks\useUserSettings.ts
        if (unlockedCache && selectedCache) {
            setCustomizations({ ...unlockedCache, ...selectedCache });
        }
    };
    
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<UserSettings>;
        const completeSettings: UserSettings = {
          displayName: data.displayName || user.displayName || "",
          email: data.email || user.email || "",
          tokens: data.tokens || 0,
          unlockedLevels: data.unlockedLevels || {},

### C:\Users\brand\BloomCruxfixevenmoreshissss\src\lib\firestore.ts
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

### C:\Users\brand\BloomCruxfixevenmoreshissss\src\stitch\lib\firestore.ts
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

## User-scoped collection paths
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\decks\DecksClient.tsx:207 :: collection(db, "users", user.uid, "folders"),

## Direct user.uid usage
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\decks\DecksClient.tsx:181 :: const d = await getUserDecks(user.uid);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\decks\DecksClient.tsx:204 :: console.log("[folders:read] subscribe", user.uid);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\decks\DecksClient.tsx:207 :: collection(db, "users", user.uid, "folders"),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\decks\folders\new\page.tsx:61 :: console.log("[folders:create] start", { uid: user.uid, name: name.trim(), color });
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\decks\folders\new\page.tsx:64 :: collection(getDb(), "users", user.uid, "folders"),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\home\page.tsx:37 :: getTopics(user.uid),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\home\page.tsx:38 :: getUserProgress(user.uid)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\edit\page.tsx:428 :: const fetchedDeck = await getDeck(user.uid, deckId);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\edit\page.tsx:539 :: await saveDeck(user.uid, updatedDeck);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\level-up\page.tsx:50 :: getTopics(user.uid),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\level-up\page.tsx:51 :: getDeckProgress(user.uid),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\level-up\page.tsx:122 :: await resetDeckPurchaseCounts(user.uid, deckId);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\page.tsx:55 :: getDeck(user.uid, deckId),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\page.tsx:56 :: getUserDeckProgress(user.uid, deckId),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\practice\page.tsx:53 :: getDeckPurchaseCounts(user.uid, deck.id).then(setPurchaseCounts);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\practice\page.tsx:79 :: logCardAttempt(user.uid, { deckId: deck.id, cardId: String(card.id), bloomLevel: card.bloomLevel, wasCorrect, timestamp: new Date() }).then(({ xpBreakdown }) => {
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\practice\page.tsx:93 :: await purchasePowerUp(user.uid, deck.id, type, cost);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\practice\page.tsx:214 :: getTopics(user.uid),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\practice\page.tsx:215 :: getDeckProgress(user.uid),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\practice\page.tsx:216 :: getUserDeckProgress(user.uid, deckId),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\practice\page.tsx:217 :: getUserXpStats(user.uid)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:56 :: const { global } = await getUserProgress(user.uid);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:59 :: uid: user.uid,
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:61 :: fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:72 :: uid: user.uid,
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:75 :: fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:79 :: uid: user.uid,
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:81 :: fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:86 :: const card = cardId ? await getCardById(user.uid, deckId, cardId) : null;
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:118 :: await advance({ uid: user.uid, deckId });
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:122 :: uid: user.uid,
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:124 :: fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:135 :: uid: user.uid,
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:138 :: fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:142 :: uid: user.uid,
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:144 :: fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:149 :: const card = cardId ? await getCardById(user.uid, deckId, cardId) : null;
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:160 :: const sessionRef = doc(getDb(), "users", user.uid, "questSessions", deckId);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:213 :: logCardAttempt(user.uid, {
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx:34 :: const { global } = await getUserProgress(user.uid);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx:37 :: uid: user.uid,
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx:39 :: fetchAllCardsInDeck: (id) => getAllCardsForDeck(user.uid, id)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx:50 :: const c = currentId ? await getCardById(user.uid, deckId, currentId) : null;
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx:73 :: await advanceRemix(user.uid, deckId as string);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx:76 :: uid: user.uid,
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx:78 :: fetchAllCardsInDeck: (id) => getAllCardsForDeck(user.uid, id)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx:89 :: const c = currentId ? await getCardById(user.uid, deckId, currentId) : null;
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx:98 :: logCardAttempt(user.uid, {
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx:111 :: const sessionRef = doc(getDb(), "users", user.uid, "remixSessions", deckId);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\remix\page.tsx:57 :: saveUserDeckProgress(user.uid, deck.id, {
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\remix\page.tsx:75 :: getTopics(user.uid),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\remix\page.tsx:76 :: getUserDeckProgress(user.uid, deckId),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\remix\page.tsx:77 :: getUserXpStats(user.uid),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\remix\page.tsx:78 :: getDeckPurchaseCounts(user.uid, deckId)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\remix\page.tsx:117 :: await saveUserDeckProgress(user.uid, deckId, {
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\remix\page.tsx:145 :: logCardAttempt(user.uid, {
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\remix\page.tsx:168 :: saveUserDeckProgress(user.uid, deck.id, {
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\remix\page.tsx:192 :: await purchasePowerUp(user.uid, deck.id, type, cost);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\starred\page.tsx:80 :: getDeckPurchaseCounts(user.uid, deck.id).then(setPurchaseCounts);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\starred\page.tsx:106 :: logCardAttempt(user.uid, { deckId: deck.id, cardId: String(card.id), bloomLevel: card.bloomLevel, wasCorrect, timestamp: new Date() }).then(({ xpBreakdown }) => {
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\starred\page.tsx:120 :: await purchasePowerUp(user.uid, deck.id, type, cost);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\starred\page.tsx:240 :: getTopics(user.uid),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\starred\page.tsx:241 :: getUserDeckProgress(user.uid, deckId),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\starred\page.tsx:242 :: getUserXpStats(user.uid)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\timed\page.tsx:120 :: const topics = await getTopics(user.uid);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\timed\page.tsx:130 :: getDeckPurchaseCounts(user.uid, deckId),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\timed\page.tsx:131 :: getUserDeckProgress(user.uid, deckId),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\timed\page.tsx:132 :: getUserXpStats(user.uid)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\timed\page.tsx:175 :: logCardAttempt(user.uid, {
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\timed\page.tsx:195 :: await purchasePowerUp(user.uid, deckId, type, cost);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\topic-trek\page.tsx:33 :: const topics = await getTopics(user.uid);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\AgentCard.tsx:62 :: const unsubscribe = getUserCustomizations(user.uid, (c) => setCustomizations(c));
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\DashboardClient.tsx:100 :: getDeckProgress(user.uid), // gets all attempts
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\DashboardClient.tsx:101 :: getUserProgress(user.uid), // gets global and deck-specific levels/xp
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\DashboardClient.tsx:102 :: getUserXpStats(user.uid),
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\folders\EditFolderDialog.tsx:46 :: const saved = await updateFolder(user.uid, folder.id, {
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\GlobalShop.tsx:35 :: await purchaseShopItem(user.uid, item);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\Header.tsx:43 :: const unsubscribe = getUserCustomizations(user.uid, (c) => setCustomizations(c));
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\PowerUpInventory.tsx:32 :: const unsubscribe = getUserInventory(user.uid, (inv: UserInventory) => {
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\PowerUpModal.tsx:33 :: const unsubscribe = getUserInventory(user.uid, setInventory);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\ProfileSettings.tsx:31 :: const photoRef = storageRef(storage, `profilePhotos/${user.uid}/${file.name}`);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\StudyMissionLayout.tsx:57 :: const { global } = await getUserProgress(user.uid);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\hooks\useUserSettings.ts:123 :: const settingsRef = doc(getDb(), "users", user.uid);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\hooks\useUserSettings.ts:124 :: const unlockedCustomizationsRef = doc(getDb(), "users", user.uid, "customizations", "unlocked");
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\hooks\useUserSettings.ts:125 :: const selectedCustomizationsRef = doc(getDb(), "users", user.uid, "customizations", "selected");
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\hooks\useUserSettings.ts:213 :: const ref = doc(getDb(), "users", user.uid);
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\hooks\useUserSettings.ts:222 :: await saveSelectedCustomizationsFs(user.uid, selections);

## Files importing @/lib/firebase (should be 'use client' + guards)
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\decks\folders\new\page.tsx  | use client: True | guard-ish: True
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\decks\DecksClient.tsx  | use client: True | guard-ish: True
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx  | use client: False | guard-ish: False
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx  | use client: False | guard-ish: False
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\Providers\AuthProvider.client.tsx  | use client: True | guard-ish: True
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\auth\login-form.tsx  | use client: False | guard-ish: False
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\ProfileSettings.tsx  | use client: True | guard-ish: True
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\context\AuthContext.tsx  | use client: True | guard-ish: True
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\hooks\useUserSettings.ts  | use client: False | guard-ish: False
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\lib\firestore.ts  | use client: False | guard-ish: False
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\lib\quest.ts  | use client: False | guard-ish: False
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\lib\remix.ts  | use client: True | guard-ish: False
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\stitch\lib\firebase.ts  | use client: False | guard-ish: True

## Direct firebase/* imports outside src/lib/firebase.client.ts
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\decks\DecksClient.tsx:27 :: import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\(app)\decks\folders\new\page.tsx:5 :: import { collection, addDoc, serverTimestamp } from "firebase/firestore";
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\quest\page.tsx:34 :: import { collection, deleteDoc, doc, getDocs, orderBy, query, where } from 'firebase/firestore';
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\decks\[deckId]\study\random-remix\page.tsx:14 :: import { doc, deleteDoc } from "firebase/firestore";
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\Providers\AuthProvider.client.tsx:3 :: import type { User } from 'firebase/auth';
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\app\Providers\AuthProvider.client.tsx:4 :: import { onAuthStateChanged } from 'firebase/auth';
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\auth\login-form.tsx:5 :: import { signInWithEmailAndPassword } from 'firebase/auth';
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\DashboardClient.tsx:22 :: import { Timestamp } from 'firebase/firestore';
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\ProfileSettings.tsx:13 :: import { updateProfile, type User as FirebaseUser } from 'firebase/auth';
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\components\ProfileSettings.tsx:17 :: import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\context\AuthContext.tsx:14 :: } from "firebase/auth";
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\hooks\useUserSettings.ts:5 :: import { doc, onSnapshot, setDoc, getDoc, writeBatch } from "firebase/firestore";
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\lib\firebase.ts:1 :: export type { Auth } from "firebase/auth";
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\lib\firebase.ts:2 :: export type { Firestore } from "firebase/firestore";
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\lib\firebase.ts:3 :: export type { FirebaseStorage } from "firebase/storage";
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\lib\firestore.ts:27 :: import { onSnapshot, query, collection, where, doc, getDocs, getDoc } from "firebase/firestore";
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\lib\quest.ts:2 :: import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\lib\remix.ts:4 :: import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\stitch\adapters.ts:2 :: import type { Timestamp } from 'firebase/firestore';
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\stitch\lib\firestore.ts:24 :: import { collection, getDocs, query, where, addDoc, serverTimestamp, Timestamp, doc, setDoc, getDoc, runTransaction, writeBatch, increment, deleteDoc, onSnapshot, Unsubscribe, collectionGroup, orderBy, limit } from 'firebase/firestore';
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\stitch\lib\firestore.ts:31 :: import { type User, updateProfile } from 'firebase/auth';
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\stitch\lib\firestore.ts:33 :: import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
- C:\Users\brand\BloomCruxfixevenmoreshissss\src\types\index.ts:2 :: import type { Timestamp } from 'firebase/firestore';
