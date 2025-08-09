'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PowerUpType, PurchaseCounts, GlobalProgress } from "@/types";
import { PowerUpMenu } from "@/components/PowerUpModal";
import AgentCard from "./AgentCard";
import { useUserAuth } from "@/context/AuthContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import { getUserProgress } from "@/lib/firestore";

interface StudyMissionLayoutProps {
    children: React.ReactNode;
    deckTitle: string;
    deckLevel?: number;
    progress: number;
    tokens: number;
    powerUpsExpanded: boolean;
    setPowerUpsExpanded: (expanded: boolean) => void;
    onUsePowerUp: (powerUpId: PowerUpType, cost: number) => void;
    purchaseCounts: PurchaseCounts;
    timerValue?: number;
    timerMaxValue?: number;
    currentLevelName?: string;
    cardsLeftInLevel?: number;
}

export function StudyMissionLayout({
    children,
    deckTitle,
    deckLevel,
    progress,
    tokens,
    powerUpsExpanded,
    setPowerUpsExpanded,
    onUsePowerUp,
    purchaseCounts,
    timerValue,
    timerMaxValue,
    currentLevelName,
    cardsLeftInLevel,
}: StudyMissionLayoutProps) {
    const router = useRouter();
    const { user } = useUserAuth();
    const { settings } = useUserSettings();
    const [globalProgress, setGlobalProgress] = useState<GlobalProgress | null>(null);

    useEffect(() => {
        if (!user?.uid) return;
        
        let alive = true;
        
        (async () => {
            const { global } = await getUserProgress(user.uid);
            if (alive) setGlobalProgress(global);
        })();
        
        return () => {
            alive = false;
        };
    }, [user?.uid]);

    const timerColor = useMemo(() => {
        if (timerValue === undefined || timerMaxValue === undefined) return 'text-primary';
        if (timerValue > timerMaxValue / 2) return 'text-green-500';
        if (timerValue > timerMaxValue / 4) return 'text-yellow-500';
        return 'text-red-500';
    }, [timerValue, timerMaxValue]);
    
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = (timerValue !== undefined && timerMaxValue) ? (circumference - (timerValue / timerMaxValue) * circumference) : 0;


    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA] font-sans">
            <div className="container mx-auto px-6 py-8">
                <header className="flex items-center justify-between mb-6">
                    <button className="text-gray-500 hover:text-gray-700" onClick={() => router.back()}>
                        <X />
                    </button>
                    <div className="w-full mx-4">
                        <div className="flex justify-between items-center mb-1">
                             <span className="text-sm font-semibold text-gray-600 truncate">
                                {deckTitle}
                                {currentLevelName && ` - ${currentLevelName}`}
                                {cardsLeftInLevel !== undefined && ` - ${cardsLeftInLevel} left`}
                             </span>
                             {deckLevel && <span className="text-sm font-bold text-primary">Level {deckLevel}</span>}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="progress-bar-inner h-2.5 rounded-full"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                    {timerValue !== undefined ? (
                         <div className="relative h-10 w-10">
                            <svg viewBox="0 0 40 40" className="w-full h-full transform -rotate-90">
                                <circle cx="20" cy="20" r={radius} strokeWidth="4" className="text-muted" fill="none" />
                                <motion.circle
                                    cx="20" cy="20" r={radius}
                                    strokeWidth="4"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    className={cn("transition-colors duration-500", timerColor)}
                                    fill="none"
                                    strokeLinecap="round"
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: dashOffset }}
                                    transition={{ duration: 1, ease: "linear" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold">{timerValue}</span>
                            </div>
                        </div>
                    ) : (
                        // Token display removed from here as per user request
                        <div className="w-10 h-10"></div> // Placeholder for spacing
                    )}
                </header>
                
                <div className="flex gap-8">
                    <main className="flex-1 w-full max-w-2xl mx-auto">
                        {children}
                        <div className="space-y-2 mt-8">
                            <div className="flex justify-center">
                            <button
                                onClick={() => setPowerUpsExpanded(!powerUpsExpanded)}
                                className="flex items-center space-x-2 bg-white border border-gray-300 rounded-full px-5 py-3 text-gray-700 font-semibold hover:bg-gray-100 transition-colors shadow-sm"
                            >
                                <Zap className="text-purple-500" />
                                <span>Power-Ups</span>
                            </button>
                            </div>
                            <AnimatePresence>
                                {powerUpsExpanded && (
                                   <PowerUpMenu onUse={onUsePowerUp} purchaseCounts={purchaseCounts} />
                                )}
                            </AnimatePresence>
                        </div>
                    </main>
                    <aside className="w-80 sticky top-24 hidden lg:block">
                      <AgentCard 
                        globalProgress={globalProgress} 
                        settings={settings ? { displayName: settings?.displayName ?? "", tokens: settings?.tokens ?? 0 } : null}
                        photoURL={user?.photoURL}
                      />
                    </aside>
                </div>
            </div>
        </div>
    );
}