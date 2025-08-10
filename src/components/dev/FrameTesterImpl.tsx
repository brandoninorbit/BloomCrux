
"use client";

import { useState, useEffect, useRef } from "react";
import { doc, getDocs, collection, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserAuth } from "@/app/Providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical } from "lucide-react";
import type { FrameConfig } from "@/config/avatarFrames";
import { useToast } from "@/hooks/use-toast";

type FrameOption = {
  key: string;
  name: string;
  config: FrameConfig;
};

export default function FrameTesterImpl() {
  const [isOpen, setIsOpen] = useState(false);
  const [frames, setFrames] = useState<FrameOption[]>([]);
  const { user } = useUserAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchFrames = async () => {
      // In a real app, this would fetch from Firestore.
      // For now, we'll import the static config.
      const { avatarFrames } = await import("@/config/avatarFrames");
      const frameOptions: FrameOption[] = Object.entries(avatarFrames).map(
        ([key, config]) => ({
          key,
          name: config.name,
          config,
        })
      );
      setFrames(frameOptions);
    };
    fetchFrames();
  }, []);

  const handleSelectFrame = async (frameKey: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to select a frame.",
      });
      return;
    }
    try {
      const selectedRef = doc(
        db,
        "users",
        user.uid,
        "customizations",
        "selected"
      );
      await updateDoc(selectedRef, { activeAvatarFrame: frameKey });
      toast({
        title: "Frame Updated!",
        description: `Set active frame to "${
          frames.find((f) => f.key === frameKey)?.name
        }".`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update frame:", error);
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  return (
    <div className="fixed top-1/2 left-4 z-[1000] -translate-y-1/2">
      <div className="relative">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg h-12 w-12"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FlaskConical />
        </Button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-full top-0 ml-2 w-56 rounded-md bg-background shadow-lg border"
            >
              <div className="p-2 font-semibold border-b">Test Frames</div>
              <ul className="py-1">
                {frames.map((frame) => (
                  <li key={frame.key}>
                    <button
                      onClick={() => handleSelectFrame(frame.key)}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent"
                    >
                      {frame.name}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
