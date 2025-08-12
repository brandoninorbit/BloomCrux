import { initializeApp, getApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// This function now safely gets the config, returning null on the server.
function getFirebaseConfig(): FirebaseOptions | null {
  // During server-side rendering, window is not defined, and neither are NEXT_PUBLIC_ variables.
  // This check prevents Firebase from trying to initialize on the server.
  if (typeof window === "undefined") {
    return null;
  }
  
  const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (firebaseConfigString) {
    try {
      return JSON.parse(firebaseConfigString);
    } catch (e) {
      console.error("Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG", e);
      return null;
    }
  }

  // Fallback to individual environment variables if the combined one isn't set.
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
}


// --- Singleton Pattern for Firebase Services ---
// We store the initialized services here to avoid re-creating them.
let app;
let auth;
let db;
let storage;

// This function initializes Firebase if it hasn't been already.
function initializeFirebase() {
  const config = getFirebaseConfig();
  if (config && !getApps().length) {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } else if (getApps().length) {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
}

// Ensure Firebase is initialized on the client side.
initializeFirebase();

// Export getters that return the initialized services.
export function getFirebaseAuth() {
  if (!auth) initializeFirebase();
  return auth!;
}

export function getDb() {
  if (!db) initializeFirebase();
  return db!;
}

export function getFirebaseStorage() {
  if (!storage) initializeFirebase();
  return storage!;
}
