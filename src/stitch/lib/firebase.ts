'use client';
// Client-safe facade only exposes nullable getters + config probe.
"use client";
export {
  getDb,
  getFirebaseAuth,
  getFirebaseStorage,
  isFirebaseConfigured,
} from '@/lib/firebase.client';


