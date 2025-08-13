/**
 * Client-only Firebase entry (LAZY + GUARDED).
 * - No top-level initializeApp. We init on first use, only in the browser,
 *   and only if NEXT_PUBLIC_FIREBASE_API_KEY looks real (starts with "AIza").
 * - This prevents Next.js prerender from initializing Firebase on the server.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  getRedirectResult,
  signOut,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  updateProfile,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  doc, collection, query, where, orderBy, limit,
  getDoc, getDocs, setDoc, updateDoc, onSnapshot,
  addDoc, serverTimestamp, deleteDoc, runTransaction, writeBatch, increment,
  Timestamp, type Firestore
} from "firebase/firestore";
import {
  getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage
} from "firebase/storage";

// --- runtime guards ---
function isBrowser() { return typeof window !== "undefined"; }
function hasPlausibleClientKeys() {
  const k = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return typeof k === "string" && k.startsWith("AIza");
}

// --- lazy init ---
let _app: FirebaseApp | null = null;
function _ensureApp(): FirebaseApp {
  if (_app) return _app;
  if (!isBrowser() || !hasPlausibleClientKeys()) {
    // Do NOT initialize on the server or with bogus keys.
    // Returning a thrown error is better than silently initing during prerender.
    throw new Error("Firebase not configured");
  }
  _app = getApps().length ? getApp() : initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  });
  return _app;
}

// --- getters used by the SSR-safe facade ---
export function getFirebaseApp(): FirebaseApp { return _ensureApp(); }
export function getFirebaseAuth(): Auth { return getAuth(_ensureApp()); }
export function getDb(): Firestore { return getFirestore(_ensureApp()); }
export function getStorageBucket(): FirebaseStorage { return getStorage(_ensureApp()); }

// --- convenience flags (some code imports these) ---
export function isFirebaseConfigured(): boolean { return isBrowser() && hasPlausibleClientKeys(); }
export function ensureFirebaseClientLoaded(): boolean { return isBrowser() && (getApps().length > 0); }

// ---- Re-exports (single canonical set) ----

// Auth
export {
  getAuth,
  onAuthStateChanged,
  getRedirectResult,
  signOut,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  updateProfile,
};

// Firestore
export {
  doc, collection, query, where, orderBy, limit,
  getDoc, getDocs, setDoc, updateDoc, onSnapshot,
  addDoc, serverTimestamp, deleteDoc, runTransaction, writeBatch, increment,
  Timestamp,
};

// Storage
export {
  ref,                // raw
  ref as storageRef,  // alias used around the app
  uploadBytes, getDownloadURL,
};

// Alias for older code
export const getFirebaseStorage = getStorageBucket;
