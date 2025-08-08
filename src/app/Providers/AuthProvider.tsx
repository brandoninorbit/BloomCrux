
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  User,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, pass: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signInWithApple: () => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const handleUserDocument = async (user: User) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create user document on first login
      try {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          role: 'user',
          commanderLevel: 1
        });
      } catch (error) {
        console.error("Error creating user document:", error);
      }
    }
  };


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await handleUserDocument(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string):Promise<void> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set a default display name
        const displayName = userCredential.user.displayName || email.split('@')[0];
        await updateProfile(userCredential.user, {
            displayName: displayName,
        });
        // Update the user state immediately with the new info
        setUser({ ...userCredential.user, displayName: displayName });
        await handleUserDocument(userCredential.user);
    } catch(error) {
        console.error("Error signing up:", error)
        throw error;
    }
  };

  const signInWithProvider = async (provider: GoogleAuthProvider | OAuthProvider) => {
    try {
        const result = await signInWithPopup(auth, provider);
        await handleUserDocument(result.user);
    } catch(error) {
        console.error(`Error signing in with ${provider.providerId}`, error);
        throw error;
    }
  }

  const signInWithGoogle = () => signInWithProvider(new GoogleAuthProvider());
  
  const signInWithApple = () => signInWithProvider(new OAuthProvider('apple.com'));

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  const value = {
    user,
    loading,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
