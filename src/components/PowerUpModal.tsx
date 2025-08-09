
'use client';

import { motion } from "framer-motion";
import { Coins, RefreshCw, Lightbulb, CheckCheck, Timer, Search, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PowerUpType, PurchaseCounts, ShopItem, UserInventory, UserSettings } from "@/types";
import { GLOBAL_SHOP_ITEMS } from "@/lib/shop-items";
import { useEffect, useState } from "react";
import { useUserAuth } from "@/context/AuthContext";
import { getUserInventory } from "@/lib/firestore";
import { useUserSettings } from "@/hooks/useUserSettings";

const powerUpDetailsMap: Record<string, Omit<ShopItem, 'type'>> = {};
GLOBAL_SHOP_ITEMS.forEach(item => {
    powerUpDetailsMap[item.id] = item;
});


export const PowerUpMenu = ({ 
    onUse,
    purchaseCounts 
}: { 
    onUse: (type: PowerUpType, cost: number) => void; 
    purchaseCounts: PurchaseCounts
}) => {
    const { user } = useUserAuth();
    const { settings } = useUserSettings();
    const [inventory, setInventory] = useState<UserInventory>({});

    useEffect(() => {
        if(user) {
            const unsubscribe = getUserInventory(user.uid, setInventory);
            return () => { if(typeof unsubscribe === 'function') unsubscribe(); };
        }
    }, [user]);

    const calculateCost = (type: PowerUpType) => {
        const count = purchaseCounts[type] || 0;
        const baseCost = powerUpDetailsMap[type]?.cost || 999;
        return Math.ceil(baseCost * (1 + 0.1 * count));
    }
    
    const availablePowerUps = Object.keys(inventory).filter(key => inventory[key] > 0);
    
    if (availablePowerUps.length === 0) {
        return (
             <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <div className="text-center p-4 bg-white rounded-lg border shadow-inner">
                    <p className="text-muted-foreground">No power-ups available. Visit the shop to purchase some!</p>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
        >
            <div className="space-y-3 p-4 bg-white rounded-lg border shadow-inner">
                {availablePowerUps.map(type => {
                    const powerUp = powerUpDetailsMap[type as PowerUpType];
                    if (!powerUp) return null;

                    const cost = calculateCost(type as PowerUpType);
                    const isFutureFeature = ['hint', 'focus'].includes(powerUp.id);
                    const canAfford = (settings?.tokens || 0) >= cost;
                    const Icon = { RefreshCw, Lightbulb, CheckCheck, Timer, Search, LockOpen }[powerUp.icon as keyof typeof powerUpIcons];

                    return (
                        <div key={type} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-full">
                                    <Icon className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">{powerUp.name}</p>
                                    <p className="text-xs text-muted-foreground">{powerUp.description}</p>
                                    {isFutureFeature && <p className="text-xs text-amber-600 font-semibold">(Coming soon)</p>}
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={!canAfford || isFutureFeature}
                                onClick={() => onUse(type as PowerUpType, cost)}
                                className="w-28"
                            >
                                <Coins className="mr-2 h-4 w-4" />
                                {cost}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    )
}

// Helper object to dynamically select icon component
const powerUpIcons = {
    RefreshCw,
    Lightbulb,
    CheckCheck,
    Timer,
    Search,
    LockOpen
};


