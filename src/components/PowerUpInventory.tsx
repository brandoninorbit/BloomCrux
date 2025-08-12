'use client';

import React, { useState } from 'react';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import { getUserInventory } from '@/lib/firestore';
import type { UserInventory, ShopItem } from '@/types';
import { GLOBAL_SHOP_ITEMS } from '@/lib/shop-items';
import { RefreshCw, Lightbulb, CheckCheck, Timer, Search, LockOpen, Zap, Package } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const powerUpDetailsMap: Record<string, Omit<ShopItem, 'type'>> = {};
GLOBAL_SHOP_ITEMS.forEach(item => {
    powerUpDetailsMap[item.id] = item;
});

const powerUpIcons = { RefreshCw, Lightbulb, CheckCheck, Timer, Search, LockOpen, Zap };

export default function PowerUpInventory() {
    const { user } = useUserAuth();
    const [inventory, setInventory] = useState<UserInventory>({});
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    React.useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        // Use proper typing for the inventory callback
        const unsubscribe = getUserInventory(user.uid, (inv: UserInventory) => {
            setInventory(inv);
            setLoading(false);
        });

        return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
    }, [user]);
    
    const availablePowerUps = Object.keys(inventory).filter(key => inventory[key] > 0);

    return (
        <div className="space-y-2">
            <div className="flex justify-center">
                <button
                    onClick={() => setIsExpanded(prev => !prev)}
                    className="flex items-center space-x-2 bg-white border border-gray-300 rounded-full px-5 py-3 text-gray-700 font-semibold hover:bg-gray-100 transition-colors shadow-sm"
                >
                    <Zap className="text-purple-500" />
                    <span>Power-Up Inventory</span>
                </button>
            </div>
            <AnimatePresence>
                {isExpanded && (
                     <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 p-4 bg-white rounded-lg border shadow-inner">
                            {loading ? (
                                <div className="flex justify-center items-center h-24">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : availablePowerUps.length > 0 ? (
                                availablePowerUps.map(type => {
                                    const details = powerUpDetailsMap[type];
                                    if (!details) return null;
                                    const Icon = powerUpIcons[details.icon as keyof typeof powerUpIcons] || Zap;

                                    return (
                                        <motion.div
                                            key={type}
                                            className="flex items-center justify-between"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 rounded-full">
                                                    <Icon className="h-5 w-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{details.name}</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-lg text-primary">
                                                x{inventory[type]}
                                            </div>
                                        </motion.div>
                                    )
                                })
                            ) : (
                                <p className="text-center text-muted-foreground py-4">
                                    You have no power-ups.
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
