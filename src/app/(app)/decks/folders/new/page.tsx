'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { useState } from "react";
import { useRouter } from "next/navigation";


import { useUserAuth } from "@/context/AuthContext";


import type { FolderColor, FolderSummary } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, getDb, isFirebaseConfigured, serverTimestamp } from '@/lib/firebase.client';

const COLORS: FolderColor[] = ["blue", "green", "yellow", "purple", "pink", "orange", "gray"];

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

export default function NewFolderPage({
  onCreate,
}: {
  onCreate?: (newFolder: FolderSummary) => void;
}) {
  const { user } = useUserAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [color, setColor] = useState<FolderColor>("blue");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Folder name cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!isFirebaseConfigured()) {
        console.error('Firebase not configured');
        setError('Firebase not configured');
        setIsSubmitting(false);
        return;
      }
      const db = getDb();
      if (!db || !user?.uid) {
        setError('You must be signed in to create a folder.');
        setIsSubmitting(false);
        return;
      }
      let newFolder: FolderSummary;

      if (user?.uid) {
        console.log("[folders:create] start", { uid: user.uid, name: name.trim(), color });

        const ref = await addDoc(
          collection(db, 'users', user.uid, 'folders'),
          {
            name: name.trim(),
            color,
            setCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );

        console.log("[folders:create] success", { id: ref.id });

        newFolder = {
          id: ref.id,
          name: name.trim(),
          color,
          setCount: 0,
          updatedAt: new Date(), // for optimistic UI; Firestore has serverTimestamp
        };
      } else {
        // Logged-out test mode: create a temporary mock (non-persistent)
        newFolder = {
          id: `mock_${Date.now()}`,
          name: name.trim(),
          color,
          setCount: 0,
          updatedAt: new Date(),
        };
        console.log("[folders:create] mock (logged-out)", newFolder);
      }

      onCreate?.(newFolder);

      toast({
        title: "Folder created",
        description: `"${name.trim()}" has been added.`,
      });

      router.push("/decks");
    } catch (err) {
      console.error("[folders:create] error", err);
      setError("Failed to create folder. Please try again.");
      toast({
        title: "Couldn't create folder",
        description: String(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Folder</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Biology 101"
                maxLength={60}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Select ${c} color`}
                    onClick={() => setColor(c)}
                    disabled={isSubmitting}
                    className="h-10 w-10 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                    style={{ backgroundColor: colorToHex(c) }}
                  >
                    {color === c && (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-black/30">
                        <div className="h-4 w-4 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Folder
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}






