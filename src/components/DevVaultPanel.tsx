'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Vault, Settings, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { unlockables, Unlockable } from '@/config/devUnlockables';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

function getOverrideKey(key: string) {
    return `devOverride:${key}`;
}

export default function DevVaultPanel() {
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});

    // Load initial override states from localStorage
    useEffect(() => {
        const initialOverrides: Record<string, boolean> = {};
        unlockables.forEach(u => {
            const storedValue = localStorage.getItem(getOverrideKey(u.key));
            initialOverrides[u.key] = storedValue === 'true';
        });
        setOverrides(initialOverrides);
    }, []);

    const handleToggle = (key: string) => {
        setOverrides(prev => {
            const newValue = !prev[key];
            localStorage.setItem(getOverrideKey(key), String(newValue));
            return { ...prev, [key]: newValue };
        });
    };

    const commanderUnlocks = unlockables.filter(u => u.type === 'commander');
    const powerupUnlocks = unlockables.filter(u => u.type === 'powerup');

    const renderToggleRow = (unlockable: Unlockable) => (
        <div key={unlockable.key} className="flex items-center justify-between p-2 rounded-md hover:bg-primary/10">
            <Label htmlFor={unlockable.key} className="flex-1 cursor-pointer">
                {unlockable.label}
                <span className="text-xs text-muted-foreground ml-2">({unlockable.type === 'commander' ? `Lvl ${unlockable.requirement}` : `${unlockable.requirement} tokens`})</span>
            </Label>
            <Switch
                id={unlockable.key}
                checked={overrides[unlockable.key] || false}
                onCheckedChange={() => handleToggle(unlockable.key)}
            />
        </div>
    );

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
        >
            <Card className="max-w-5xl mx-auto border-primary/50 bg-muted/30">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <Vault className="h-8 w-8 text-primary" />
                        <CardTitle className="text-2xl">Developer Vault</CardTitle>
                    </div>
                    <CardDescription>
                        Toggle these switches to simulate unlocking features or acquiring power-ups for testing purposes. Changes are saved to local storage.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Settings className="h-5 w-5 text-muted-foreground" />
                            <h4 className="font-semibold text-lg">Feature Unlocks</h4>
                        </div>
                        <Separator className="mb-2" />
                        <div className="space-y-1">
                            {commanderUnlocks.map(renderToggleRow)}
                        </div>
                    </div>
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-5 w-5 text-muted-foreground" />
                            <h4 className="font-semibold text-lg">Power-Up Simulation</h4>
                        </div>
                        <Separator className="mb-2" />
                        <div className="space-y-1">
                            {powerupUnlocks.map(renderToggleRow)}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}


