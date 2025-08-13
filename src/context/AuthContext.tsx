'use client';
"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  User as FirebaseUser,
} from "@/lib/firebase.client";
import { getFirebaseAuth } from '@/lib/firebase.client';
import { isFirebaseConfigured } from '@/lib/firebase.client';

type User = FirebaseUser | null;
export type AuthCtx = {
  user: User;
  loading: boolean;
  // naming kept for compatibility with existing code
  logOut: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  // email/password flows
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  forceReloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const auth = getFirebaseAuth();

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) { setUser(null); setLoading(false); return; }
    // Handles: initial user, post-redirect login, and any auth state changes
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    // Optional: surface redirect errors (e.g., blocked popups etc.)
    getRedirectResult(auth).catch((err) => {
      console.warn("Google redirect result error", err);
    });

    return () => unsub();
  }, [auth]);

  async function logOut() {
    await firebaseSignOut(auth);
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    // Force the Google account chooser so it doesn't silently pick a cached account
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  }

  async function signInWithGoogleRedirect() {
    const provider = new GoogleAuthProvider();
    // Force the Google account chooser so it doesn't silently pick a cached account
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithRedirect(auth, provider);
  }

  async function signInWithApple() {
    const provider = new OAuthProvider("apple.com");
    await signInWithPopup(auth, provider);
  }

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string) {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function forceReloadUser() {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
    }
  }

  const value: AuthCtx = {
    user,
    loading,
    logOut,
    signOut: logOut,
    signInWithGoogle,
    signInWithGoogleRedirect,
    signInWithApple,
    signIn,
    signUp,
    forceReloadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useUserAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useUserAuth must be used within an AuthContextProvider");
  return ctx;
}

