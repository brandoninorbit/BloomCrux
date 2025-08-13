## 2025-08-12 Firebase guards & SSR safety sweep

- Enforced client-only Firebase split:
  - src/lib/firebase.client.ts = sole firebase/* imports + initializeApp
  - src/lib/firebase.ts = SSR-safe facade, no firebase/* imports (even types)
- Guarded listeners and queries:
  - src/app/(app)/decks/DecksClient.tsx — uses db && uid && isFirebaseConfigured()
  - src/hooks/useUserSettings.ts — all doc()/onSnapshot()/writes guarded and uid computed
- Removed all direct firebase/* imports outside firebase.client.ts
- Marked any file importing the facade as 'use client'
- Providers and layout wired for client-safety
