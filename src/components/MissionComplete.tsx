"use client";

import { ReactNode } from "react";
import AgentCard from "@/components/AgentCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
// If you don't have framer-motion, remove the small animation wrapper below.
import { motion } from "framer-motion";
import { Trophy, ArrowLeft, RefreshCcw } from "lucide-react";
import { useUserAuth } from "@/app/Providers/AuthProvider";
import { useUserSettings } from "@/hooks/useUserSettings";
import type { GlobalProgress } from "@/types";

type Props = {
  modeName: string;
  deckName: string;
  xp: number;
  coins: number;
  accuracy: number; // 0–100
  questionsAnswered: number;
  onReturnHQ: () => void;
  onRestartMission: () => void;
  agentSlot?: ReactNode; // optional: override default AgentCard
  globalProgress: GlobalProgress | null;
};

export default function MissionComplete({
  modeName,
  deckName,
  xp,
  coins,
  accuracy,
  questionsAnswered,
  onReturnHQ,
  onRestartMission,
  agentSlot,
  globalProgress,
}: Props) {
  const { settings } = useUserSettings();
  const { user } = useUserAuth();

  const stats = [
    { label: "XP Earned", value: `+${xp}`, tint: "blue" },
    { label: "Coins", value: `+${coins}`, tint: "yellow" },
    { label: "Accuracy", value: `${accuracy}%`, tint: "green" },
    { label: "Answered", value: `${questionsAnswered}`, tint: "purple" },
  ];

  return (
    <div className="container mx-auto p-6 text-slate-900 dark:text-slate-50">
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Agent */}
        <div className="col-span-12 md:col-span-4">
          {agentSlot ?? (
            <AgentCard
              globalProgress={globalProgress}
              settings={settings ? { displayName: settings.displayName ?? "", tokens: settings.tokens ?? 0 } : null}
              photoURL={user?.photoURL}
            />
          )}
        </div>

        {/* Right: Mission Complete */}
        <div className="col-span-12 md:col-span-8">
          {/* Header + 100% progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Mission:
                </span>{" "}
                <span className="font-medium text-primary dark:text-primary">
                  {modeName}
                </span>
                <span className="mx-2 text-slate-400">•</span>
                <span className="font-medium">{deckName}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                100%
              </div>
            </div>
            <Progress value={100} className="h-2 mt-2" />
          </div>

          {/* Card */}
          <div className="rounded-2xl border bg-card dark:bg-card p-8 shadow-sm relative overflow-hidden">
            {/* Emblem with pulsing glow */}
            <div className="relative mx-auto mb-6 w-24 h-24">
              {/* animated halo */}
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ boxShadow: "0 0 0 0 rgba(37,99,235,0.35)" }}
                animate={{ boxShadow: [
                  "0 0 0 0 rgba(37,99,235,0.35)",
                  "0 0 0 14px rgba(37,99,235,0.00)"
                ]}}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 rounded-full bg-blue-400/25 blur-xl" />
              <div className="absolute inset-1 rounded-full ring-2 ring-blue-200 dark:ring-blue-900/50" />
              <div className="relative w-full h-full rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shadow-[0_10px_20px_rgba(30,64,175,0.12)]">
                <svg className="w-12 h-12 text-blue-700 dark:text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M8 21h8M12 17v4M7 4h10v3a5 5 0 0 1-10 0V4Z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 7H5a2 2 0 0 0 2 2M17 7h2a2 2 0 0 1-2 2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-center">
              Agent, mission accomplished.
            </h1>
            <p className="text-center text-muted-foreground mt-2">
              You have successfully completed your objective.
            </p>

            {/* Stats */}
            <motion.div
              variants={{ show:{ transition:{ staggerChildren:0.05 } } }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8"
            >
              {stats.map(s => (
                <motion.div key={s.label}
                  variants={{ hidden:{opacity:0,scale:.96}, show:{opacity:1,scale:1} }}>
                  <StatTile {...s}/>
                </motion.div>
              ))}
            </motion.div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={onReturnHQ} variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to HQ
              </Button>
              <Button onClick={onRestartMission}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Start New Mission
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** small presentational tile with light-mode default + dark variants */
function StatTile({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: "blue" | "yellow" | "green" | "purple";
}) {
  const tints: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-900/40",
    yellow:
      "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:ring-yellow-900/40",
    green:
      "bg-green-50 text-green-700 ring-green-200 dark:bg-green-950/30 dark:text-green-300 dark:ring-green-900/40",
    purple:
      "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:ring-purple-900/40",
  };

  return (
    <div className={`rounded-xl p-4 text-center ring-1 ${tints[tint]}`}>
      <p className="text-xs font-medium opacity-90">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
