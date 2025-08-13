'use client';
import { useState, useEffect } from 'react';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import { useUserSettings } from '@/hooks/useUserSettings';
import { cn } from '@/lib/utils';
import { Trophy, Star, Shield, Image as ImageIcon, LucideIcon, LockOpen, RefreshCw, Lightbulb, CheckCheck, Timer, Search, HardHat, Coins } from 'lucide-react';
import { unlockables, Unlockable } from '@/config/devUnlockables';
import type { GlobalProgress, SelectedCustomizations } from '@/stitch/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getUserCustomizations } from '@/lib/firestore';
import { avatarFrames } from '@/config/avatarFrames';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AgentCardProps {
    className?: string;
    globalProgress: GlobalProgress | null;
    settings: {
        displayName: string;
        tokens: number;
    } | null;
    photoURL?: string | null;
}

const iconMap: { [key: string]: LucideIcon } = {
    Trophy,
    Shield,
    Image: ImageIcon,
    LockOpen,
    RefreshCw,
    Lightbulb,
    CheckCheck,
    Timer,
    Search,
    HardHat
};


export default function AgentCard({ className, globalProgress, settings, photoURL }: AgentCardProps) {
    const { user } = useUserAuth();
    const commanderLevel = globalProgress?.level || 0;
    const commanderUnlocks = unlockables.filter(u => u.type === 'commander');
    
    const nextUnlock = commanderUnlocks.find(u => commanderLevel < u.requirement);
    
    // Customization state
    const [customizations, setCustomizations] = useState<SelectedCustomizations | null>(null);

    useEffect(() => {
        if (!user?.uid) return;
        
        const unsubscribe = getUserCustomizations(user.uid, (c) => setCustomizations(c));
        
        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, [user?.uid]);

    const activeFrameData = customizations?.activeAvatarFrame ? avatarFrames[customizations.activeAvatarFrame] : null;

    const ActiveFrame = () => {
        if (!activeFrameData || customizations?.activeAvatarFrame === 'default') {
            return null;
        }
        return <div className={cn("absolute inset-[-4px] pointer-events-none rounded-full", activeFrameData.className)} />;
    };
    
    // Determine which icon to use for the next unlock
    let NextUnlockIcon;
    if (nextUnlock) {
      if (nextUnlock.isImplemented === false) {
        NextUnlockIcon = HardHat;
      } else {
        NextUnlockIcon = iconMap[nextUnlock.icon];
      }
    }


    return (
        <aside className={cn("w-full max-w-sm bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300", className)}>
            <div className="flex flex-col items-center">
                 <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <div className="relative mb-3">
                             <Avatar className="h-20 w-20">
                                <AvatarImage src={photoURL || "https://placehold.co/100x100.png"} alt="User avatar" data-ai-hint="profile" className="object-cover" />
                                <AvatarFallback>{settings?.displayName?.[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <ActiveFrame />
                        </div>
                      </TooltipTrigger>
                      {activeFrameData && <TooltipContent><p>{activeFrameData.name}</p></TooltipContent>}
                    </Tooltip>
                 </TooltipProvider>
                <h2 className="text-2xl font-bold text-gray-800">{settings?.displayName || 'Agent'}</h2>
                <p className="text-md text-gray-500 mt-1">Commander Level {commanderLevel}</p>

                <div className="flex items-center mt-3 space-x-2">
                    <Coins className="text-yellow-500 h-5 w-5" />
                    <span className="text-xl font-semibold text-gray-700">{settings?.tokens || 0}</span>
                </div>
                
                 <div className="mt-6 border-t border-gray-200 pt-5 w-full flex flex-col items-center">
                    <h3 className="text-md font-semibold text-gray-600 mb-3">Badges Unlocked</h3>
                    {commanderUnlocks.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-3">
                            {commanderUnlocks.map(badge => {
                                const isUnlocked = commanderLevel >= badge.requirement;
                                const BadgeIcon = isUnlocked ? (iconMap[badge.icon] || Star) : Star;
                                
                                return isUnlocked ? (
                                     <div key={badge.key} className="p-2 bg-gray-200 rounded-full hover:scale-110 transition-transform cursor-pointer">
                                        <BadgeIcon className={cn("w-6 h-6 text-yellow-500")} />
                                    </div>
                                ) : (
                                    <Dialog key={badge.key}>
                                        <DialogTrigger asChild>
                                            <button className="p-2 bg-gray-200 rounded-full hover:scale-110 transition-transform cursor-pointer">
                                                <BadgeIcon className="w-6 h-6 text-gray-400" />
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Locked Badge: {badge.label}</DialogTitle>
                                                <DialogDescription>
                                                    This badge and its associated feature are currently locked. Earn more XP by studying to increase your Commander Level and unlock new abilities.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex items-center space-x-4 rounded-md border p-4">
                                                <div className="flex-shrink-0">
                                                    <BadgeIcon className="h-10 w-10 text-primary" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                   {badge.label}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Unlocks at Commander Level {badge.requirement}
                                                </p>
                                                </div>
                                            </div>
                                             <Button type="button" onClick={() => (document.querySelector('[data-radix-dialog-close]') as HTMLElement)?.click()}>
                                                Understood
                                             </Button>
                                        </DialogContent>
                                    </Dialog>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No badges available yet.</p>
                    )}
                </div>

                {nextUnlock && NextUnlockIcon && (
                     <div className="mt-6 border-t border-gray-200 pt-5 w-full flex flex-col items-center">
                        <div className="flex items-baseline gap-2">
                           <h3 className="text-md font-semibold text-gray-600">Next Unlock -</h3>
                           <p className="text-md font-bold text-primary">Lvl {nextUnlock.requirement}</p>
                        </div>
                        <div className="flex items-center space-x-4 mt-3">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-inner">
                                <NextUnlockIcon className="text-white h-8 w-8" />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">{nextUnlock.label}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

