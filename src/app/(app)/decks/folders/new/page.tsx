
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/context/AuthContext";
import { createFolder } from "@/adapters/folders";
import type { FolderColor } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function NewFolderPage() {
  const { user } = useUserAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [color, setColor] = useState<FolderColor>("blue");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Folder name cannot be empty.");
      return;
    }
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createFolder(user.uid, { name: name.trim(), color });
      toast({ title: "Folder created!", description: `The "${name.trim()}" folder has been added.` });
      router.push("/decks");
    } catch (err) {
      setError("Failed to create folder. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
