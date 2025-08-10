
"use client";

import { useEffect, useState } from "react";
import { useUserAuth } from "@/app/Providers/AuthProvider";
import { saveSelectedCustomizations } from "@/lib/firestore";
import { avatarFrames, FrameConfig } from "@/config/avatarFrames";
import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical, Check } from "lucide-react";
import { Button } from "../ui/button";

export default function FrameTesterImpl() {
  const { user } = useUserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [frames, setFrames] = useState<Record<string, FrameConfig>>({});

  useEffect(() => {
    // In a real app, you might fetch this from Firestore.
    // For this example, we'll use the local config.
    setFrames(avatarFrames);
  }, []);

  const handleSelectFrame = async (frameKey: string) => {
    if (!user) return;
    try {
      await saveSelectedCustomizations(user.uid, { activeAvatarFrame: frameKey });
    } catch (error) {
      console.error("Failed to save frame selection:", error);
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[1000]">
      <div className="relative">
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full h-12 w-12 shadow-lg"
        >
          <FlaskConical />
        </Button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute bottom-0 left-16 w-64 bg-background border rounded-lg shadow-xl p-2"
            >
              <div className="font-semibold p-2">Select a Frame</div>
              <ul>
                {Object.entries(frames).map(([key, frame]) => (
                  <li key={key}>
                    <button
                      onClick={() => handleSelectFrame(key)}
                      className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center justify-between"
                    >
                      <span>{frame.name}</span>
                      {/* You would need to fetch the user's current selection to show a checkmark */}
                      {/* <Check className="h-4 w-4" /> */}
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
