

'use client';
import { motion } from "framer-motion";
import type { GlobalProgress, UserXpStats } from "@/types";
import { cn } from "@/lib/utils";
import { Progress } from "./ui/progress";
import { Loader2 } from "lucide-react";

const SESSION_CAP = 150;
const DAILY_CAP = 1000;

export default function GlobalProgressHeader({ global, xpStats }: { global: GlobalProgress | null, xpStats: UserXpStats | null }) {
  if (!global) {
    return (
        <header className="flex flex-col items-center p-4 bg-background shadow rounded-lg border space-y-4 h-[188px] justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </header>
    );
  }
  
  const gxp = Number(global?.xp ?? 0);
const gnext = Number(global?.xpToNext ?? 1);
const pct = Math.round((gxp / Math.max(1, gnext)) * 100);
  const sessionPct = xpStats ? Math.round((xpStats.sessionXP / SESSION_CAP) * 100) : 0;
  const dailyPct = xpStats ? Math.round((xpStats.dailyXP / DAILY_CAP) * 100) : 0;

  return (
    <header className="flex flex-col items-center p-4 bg-background shadow rounded-lg border space-y-4">
      <div className="flex items-center gap-4 w-full">
        <div className="relative">
            <svg viewBox="0 0 36 36" className="h-16 w-16">
              <path
                className="text-primary/20"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="currentColor" strokeWidth="4"
              />
              <motion.path
                className="text-primary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${pct}, 100` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{global.level}</span>
            </div>
        </div>
        <div className="flex-grow">
            <h2 className="text-lg font-bold text-foreground">Commander Level</h2>
            <p className="text-sm text-muted-foreground">{global.xp} / {global.xpToNext} XP</p>
        </div>
      </div>
       {xpStats && (
            <div className="w-full space-y-3">
                <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-muted-foreground">Session XP</span>
                        <span>{Math.min(xpStats.sessionXP, SESSION_CAP)} / {SESSION_CAP}</span>
                    </div>
                    <Progress value={sessionPct} className="[&>div]:bg-blue-500" />
                </div>
                 <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-muted-foreground">Daily XP</span>
                        <span>{xpStats.dailyXP} / {DAILY_CAP}</span>
                    </div>
                    <Progress value={dailyPct} className="[&>div]:bg-green-500" />
                </div>
            </div>
       )}
    </header>
  );
}


