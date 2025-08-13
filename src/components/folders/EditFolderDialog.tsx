"use client";

import { useState, useTransition } from "react";
import type { FolderSummary, FolderColor } from "@/types";
import { updateFolder } from "@/adapters/folders";
import { useUserAuth } from "@/context/AuthContext";

const COLORS: FolderColor[] = ["blue","green","yellow","purple","pink","orange","gray"];

export function EditFolderDialog({
  folder,
  open,
  onOpenChange,
  onUpdated, // (updated: FolderSummary) => void
}: {
  folder: FolderSummary;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: (f: FolderSummary) => void;
}) {
  const { user } = useUserAuth();
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState<FolderColor>(folder.color ?? "blue");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function validate(): string | null {
    if (!name.trim()) return "Folder name can’t be empty.";
    if (name.trim().length > 60) return "Keep folder name ≤ 60 characters.";
    if (!COLORS.includes(color)) return "Choose a valid color.";
    return null;
  }

  function onSubmit() {
    const v = validate();
    if (v) { setError(v); return; }
    if (!user) { setError("You must be signed in."); return; }

    const optimistic: FolderSummary = { ...folder, name: name.trim(), color };

    // Optimistic UI
    onUpdated(optimistic);

    startTransition(async () => {
      try {
        const saved = await updateFolder(user.uid, folder.id, {
          name: optimistic.name,
          color: optimistic.color,
        });
        onUpdated(saved);
        onOpenChange(false);
      } catch (e) {
        setError("Failed to save changes. Please try again.");
        // Revert if you keep a copy of previous state at callsite (optional)
      }
    });
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "hidden"}`}>
      <div className="absolute inset-0 bg-black/30" onClick={() => onOpenChange(false)} />
      <div className="absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Edit Folder</h3>

        <label className="block text-sm font-medium">Folder name</label>
        <input
          className="mt-1 mb-4 w-full rounded-lg border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="e.g., Chemistry"
        />

        <label className="block text-sm font-medium mb-2">Icon color</label>
        <div className="flex gap-2 mb-4">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full ring-2 ${color === c ? "ring-black" : "ring-transparent"}`}
              style={{ background: colorToHex(c) }}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button className="rounded-lg border px-3 py-2" onClick={() => onOpenChange(false)}>Cancel</button>
          <button
            className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
            onClick={onSubmit}
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function colorToHex(c: FolderColor) {
  switch (c) {
    case "blue": return "#2481f9";
    case "green": return "#22c55e";
    case "yellow": return "#facc15";
    case "purple": return "#a855f7";
    case "pink": return "#ec4899";
    case "orange": return "#f97316";
    default: return "#9ca3af"; // gray
  }
}
