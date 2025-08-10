
"use client";
import { create } from "zustand";

export type GuestFolder = { id: string; name: string; color: string; createdAt: number };

type S = {
  folders: GuestFolder[];
  addFolder: (p: { name: string; color: string }) => void;
  clear: () => void;
};

export const useGuestFolders = create<S>((set) => ({
  folders: [],
  addFolder: ({ name, color }) =>
    set((s) => ({
      folders: [{ id: crypto.randomUUID(), name: name.trim(), color, createdAt: Date.now() }, ...s.folders],
    })),
  clear: () => set({ folders: [] }),
}));
