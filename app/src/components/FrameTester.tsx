
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Check } from "lucide-react";
import type { FrameConfig } from "@/config/avatarFrames";
import { useUserAuth } from "@/app/Providers/AuthProvider";
import { saveSelectedCustomizations, getUserCustomizations } from "@/lib/firestore";
import { avatarFrames as staticFrames } from "@/config/avatarFrames";
import { cn } from "@/lib/utils";
import { useUserSettings } from "@/hooks/useUserSettings";

type FrameOption = {
  key: string;
  config: FrameConfig;
};

export default function FrameTester() {
  const [isOpen, setIsOpen] = useState(false);
  const [frameOptions, setFrameOptions] = useState<FrameOption[]>([]);
  const { user } = useUserAuth();
  const { customizations } = useUserSettings();

  // Load frames from static config file
  useEffect(() => {
    const options = Object.entries(staticFrames).map(([key, config]) => ({
      key,
      config,
    }));
    setFrameOptions(options);
  }, []);

  const handleSelectFrame = async (frameKey: string) => {
    if (!user) return;
    try {
      await saveSelectedCustomizations(user.uid, { activeAvatarFrame: frameKey });
      setIsOpen(false); // Close menu on selection
    } catch (error) {
      console.error("Failed to update frame:", error);
    }
  };
  
  const activeFrameKey = customizations?.activeAvatarFrame || 'default';

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[1000]">
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center shadow-lg"
          aria-label="Toggle Frame Tester"
        >
          <FlaskConical className="h-6 w-6" />
        </motion.button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-full top-0 ml-3 w-56 bg-white rounded-lg shadow-xl border"
            >
              <div className="p-2">
                <p className="p-2 text-sm font-semibold text-gray-700">Select Avatar Frame</p>
                {frameOptions.map(({ key, config }) => (
                  <button
                    key={key}
                    onClick={() => handleSelectFrame(key)}
                    className={cn(
                        "w-full text-left text-sm px-3 py-2 rounded-md hover:bg-gray-100 flex items-center justify-between",
                        activeFrameKey === key && "font-bold text-primary"
                    )}
                  >
                    <span>{config.name}</span>
                    {activeFrameKey === key && <Check className="h-4 w-4" />}
                  </button>
                ))}
                 <button
                    key="default"
                    onClick={() => handleSelectFrame('default')}
                    className={cn(
                        "w-full text-left text-sm px-3 py-2 rounded-md hover:bg-gray-100 flex items-center justify-between",
                        activeFrameKey === 'default' && "font-bold text-primary"
                    )}
                  >
                    <span>Default (None)</span>
                    {activeFrameKey === 'default' && <Check className="h-4 w-4" />}
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
