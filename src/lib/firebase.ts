/**
 * SSR-safe Firebase facade.
 * - No direct `firebase/*` imports at module scope.
 * - Lazily requires the client module only in the browser.
 */

type FirebaseApp = import('firebase/app').FirebaseApp;
type Auth = import('firebase/auth').Auth;
type Firestore = import('firebase/firestore').Firestore;
type FirebaseStorage = import('firebase/storage').FirebaseStorage;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function hasPlausibleClientKeys(): boolean {
  if (!isBrowser()) return false;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return typeof apiKey === 'string' && apiKey.startsWith('AIza');
}

let _client: any | null = null;
function client() {
  if (!isBrowser() || !hasPlausibleClientKeys()) return null;
  if (_client) return _client;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _client = require('./firebase.client');
  return _client;
}

export function isFirebaseConfigured(): boolean {
  return hasPlausibleClientKeys();
}

export function getFirebaseApp(): FirebaseApp | null {
  const c = client();
  return c ? (c.getFirebaseApp() as FirebaseApp | null) : null;
}

export function getFirebaseAuth(): Auth | null {
  const c = client();
  return c ? (c.getFirebaseAuth() as Auth | null) : null;
}

export function getDb(): Firestore | null {
  const c = client();
  return c ? (c.getDb() as Firestore | null) : null;
}

export function getStorageBucket(): FirebaseStorage | null {
  const c = client();
  return c ? (c.getStorageBucket() as FirebaseStorage | null) : null;
}
