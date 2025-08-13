'use client';
// src/hooks/useUserSettings.ts
'use client';

import { useEffect, useState, useCallback } from "react";
import { doc, onSnapshot, setDoc, getDoc, writeBatch } from "@/lib/firebase.client";
import { getDb, getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase.client';
import { useUserAuth } from "@/app/Providers/AuthProvider";
import type { UserSettings, UserPowerUps, UserCustomizations, SelectedCustomizations } from "@/stitch/types";
import { saveSelectedCustomizations as saveSelectedCustomizationsFs, getUserCustomizations as getUserCustomizationsFs } from '@/lib/firestore';

const defaultSettings: Omit<UserSettings, 'displayName' | 'email' | 'tokens' | 'unlockedLevels' | 'dataExport'> = {
  notifications: {
    inAppAlerts: true,
    emailProgressSummary: true,
    emailStreakReminders: false,
    emailPowerUpAnnouncements: true
  },
  appearance: {
    theme: "system",
    accentColor: "#1E90FF", // Lighter Blue
    fontSize: 1.0,
    cardAnimations: {
      flip: true,
      speed: 1.0
    },
    soundEffects: {
      flip: true,
      correctChime: true,
      incorrectChime: true
    }
  },
  studyDefaults: {
    bloomFilter: "all",
    defaultDeckCover: null,
    timedDrill: {
        defaultTime: 30,
        autoAdvance: true
    }
  },
  privacy: {
    dataSharing: true
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    screenReaderMode: false,
    focusHighlight: true,
  }
};


export function useUserSettings() {
  const { user } = useUserAuth();
  const auth = getFirebaseAuth();
  const db = getDb();
  const uid = auth?.currentUser?.uid ?? user?.uid ?? null;
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [customizations, setCustomizations] = useState<UserCustomizations & SelectedCustomizations | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect to apply theme and accent color
  useEffect(() => {
    if (settings?.appearance) {
      const { theme, accentColor } = settings.appearance;

      const body = document.body;
      body.classList.remove('light', 'dark');
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        body.classList.add(systemTheme);
      } else {
        body.classList.add(theme);
      }
      
      function hexToHsl(hex: string): string | null {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return null;

        let r = parseInt(result[1], 16) / 255;
        let g = parseInt(result[2], 16) / 255;
        let b = parseInt(result[3], 16) / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        const h_final = Math.round(h * 360);
        const s_final = Math.round(s * 100);
        const l_final = Math.round(l * 100);

        return `${h_final} ${s_final}% ${l_final}%`;
      }
      
      const hslString = hexToHsl(accentColor);
      if(hslString) {
        document.documentElement.style.setProperty('--primary', hslString);
        document.documentElement.style.setProperty('--ring', hslString);
      }
    }
  }, [settings?.appearance]);


  useEffect(() => {
    if (!user) {
      setSettings(null);
      setCustomizations(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const db = getDb();
    const settingsRef = doc(db, "users", uid);
    const unlockedCustomizationsRef = doc(db, "users", uid, "customizations", "unlocked");
    const selectedCustomizationsRef = doc(db, "users", uid, "customizations", "selected");
    
    let unlockedCache: UserCustomizations | null = null;
    let selectedCache: SelectedCustomizations | null = null;

    const updateCombinedCustomizations = () => {
        if (unlockedCache && selectedCache) {
            setCustomizations({ ...unlockedCache, ...selectedCache });
        }
    };
    
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<UserSettings>;
        const completeSettings: UserSettings = {
          displayName: data.displayName || user.displayName || "",
          email: data.email || user.email || "",
          tokens: data.tokens || 0,
          unlockedLevels: data.unlockedLevels || {},
          notifications: { ...defaultSettings.notifications, ...data.notifications },
          appearance: {
            ...defaultSettings.appearance,
            ...data.appearance,
            cardAnimations: { ...defaultSettings.appearance.cardAnimations, ...data.appearance?.cardAnimations },
            soundEffects: { ...defaultSettings.appearance.soundEffects, ...data.appearance?.soundEffects },
          },
           studyDefaults: {
            ...defaultSettings.studyDefaults,
            ...data.studyDefaults,
            timedDrill: { ...defaultSettings.studyDefaults.timedDrill, ...data.studyDefaults?.timedDrill },
          },
          privacy: { ...defaultSettings.privacy, ...data.privacy },
          accessibility: { ...defaultSettings.accessibility, ...data.accessibility },
          dataExport: {},
        };
        setSettings(completeSettings);
      }
      setLoading(false);
    }, (error) => {
        console.error("Failed to listen to user settings:", error);
        setLoading(false);
    });
    
    const unsubUnlocked = onSnapshot(unlockedCustomizationsRef, (snap) => {
        unlockedCache = snap.exists() 
            ? snap.data() as UserCustomizations 
            : { avatarFrames: [], deckCovers: [], badges: [] };
        updateCombinedCustomizations();
    });

    const unsubSelected = onSnapshot(selectedCustomizationsRef, (snap) => {
        selectedCache = snap.exists() 
            ? snap.data() as SelectedCustomizations
            : { activeAvatarFrame: 'default', activeDeckCovers: {}, activeBadge: 'default' };
        updateCombinedCustomizations();
    });

    const initializeAndMigrate = async () => {
        try {
            const settingsSnap = await getDoc(settingsRef);
            if (!settingsSnap.exists()) {
                const initialSettings: UserSettings = {
                    displayName: user.displayName || "",
                    email: user.email || "",
                    tokens: 0,
                    unlockedLevels: {},
                    ...defaultSettings,
                    dataExport: {},
                };
                await setDoc(settingsRef, initialSettings);
            }
        } catch (error) {
            console.error("Failed during settings initialization:", error);
        }
    };
    
    initializeAndMigrate();

    return () => {
        unsubSettings();
        unsubSelected();
        unsubUnlocked();
    };
  }, [user]);

  const updateSettings = async (data: Partial<UserSettings>) => {
    if (!user) throw new Error("Not signed in");
    const db = getDb();
    const ref = doc(db, "users", uid);
    
    // Firestore's { merge: true } handles deep merging of nested objects.
    // We can directly pass the partial data to be updated.
    return await setDoc(ref, data, { merge: true });
  };
  
  const saveSelectedCustomizations = useCallback(async (selections: Partial<SelectedCustomizations>) => {
    if (user) {
      await saveSelectedCustomizationsFs(uid, selections);
    }
  }, [user]);

  return { settings, customizations, updateSettings, saveSelectedCustomizations, loading };
}


