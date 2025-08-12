// SSR-safe, lazy Firebase singletons. Safe to import on the server.
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let _app: FirebaseApp | null = null;

function readConfig() {
  const blob = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (blob) {
    try { return JSON.parse(blob); } catch { /* ignore */ }
  }
  const {
    NEXT_PUBLIC_FIREBASE_API_KEY: apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: appId,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: measurementId,
  } = process.env as Record<string, string | undefined>;
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId };
}

function ensureApp(): FirebaseApp | null {
  if (_app) return _app;
  const cfg = readConfig();
  if (!cfg) return null; // no env available (e.g., during SSR/prerender)
  _app = getApps().length ? getApp() : initializeApp(cfg);
  return _app;
}

export const app: FirebaseApp | null = ensureApp();
export const auth: Auth | null = (() => {
  const a = ensureApp();
  return a ? getAuth(a) : null;
})();
export const db: Firestore | null = (() => {
  const a = ensureApp();
  return a ? getFirestore(a) : null;
})();

// Runtime getters that return non-null instances or throw with a clear message.
// Use these in client components or code that runs after env is available.
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export function getDb(): Firestore {
  const a = ensureApp();
  if (!a) throw new Error("Firebase app requested during server prerender without config");
  return getFirestore(a);
}

export function getFirebaseAuth(): Auth {
  const a = ensureApp();
  if (!a) throw new Error("Firebase app requested during server prerender without config");
  return getAuth(a);
}

export function getFirebaseStorage(): FirebaseStorage {
  const a = ensureApp();
  if (!a) throw new Error("Firebase app requested during server prerender without config");
  return getStorage(a);
}
