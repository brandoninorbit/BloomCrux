// src/lib/firebase.ts
import {
  getDb as _getDb,
  getFirebaseAuth as _getFirebaseAuth,
  getFirebaseStorage as _getFirebaseStorage,
} from "../stitch/lib/firebase"; // keep this relative path

// Create singletons and export them
export const db = _getDb();
export const auth = _getFirebaseAuth();
export const storage = _getFirebaseStorage();

// (Optional) re-export the getters if other code still uses them
export {
  _getDb as getDb,
  _getFirebaseAuth as getFirebaseAuth,
  _getFirebaseStorage as getFirebaseStorage,
};
