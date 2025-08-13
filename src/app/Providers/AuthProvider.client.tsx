'use client';
﻿'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ensureFirebaseClientLoaded, getFirebaseAuth, isFirebaseConfigured, onAuthStateChanged } from '@/lib/firebase.client';
import type { User } from '@/lib/firebase.client'; // ensure firebase.client re-exports type User


type AuthCtx = { user: User | null; loading: boolean; };
const Ctx = createContext<AuthCtx>({ user: null, loading: true });
export const useUserAuth = () => useContext(Ctx);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const auth = useMemo(() => getFirebaseAuth(), []); // may be null

  useEffect(() => { ensureFirebaseClientLoaded();
    if (!isFirebaseConfigured() || !auth) {
      setUser(null); setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u ?? null); setLoading(false); });
    return unsub;
  }, [auth]);

  return <Ctx.Provider value={{ user, loading }}>{children}</Ctx.Provider>;
}


