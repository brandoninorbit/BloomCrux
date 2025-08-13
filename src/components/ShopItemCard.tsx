'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShopItem } from '@/types';

interface ShopItemCardProps {
    item: ShopItem;
    tokens: number;
    onPurchase: (item: ShopItem) => void;
}

export default function ShopItemCard({ item, tokens, onPurchase }: ShopItemCardProps) {
    const affordable = tokens >= item.cost;
    // Power-ups are always purchasable if you can afford them.
    // Other types (like one-time themes) might have different logic in the future.
    const canPurchase = affordable;
    const isFutureFeature = ['hint', 'focus'].includes(item.id);

    return (
        <motion.div whileHover={{ y: -5 }} className="h-full">
            <Card className={cn(
                "flex flex-col h-full transition-all",
                !canPurchase && "opacity-60 bg-muted/50",
            )}>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Zap className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>{item.name}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <CardDescription>{item.description}</CardDescription>
                    {isFutureFeature && (
                        <p className="text-xs text-amber-600 mt-2 font-semibold">(Feature coming soon)</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button
                        disabled={!canPurchase}
                        onClick={() => onPurchase(item)}
                        className="w-full"
                    >
                       <>
                        <Coins className="mr-2 h-4 w-4" />
                        {item.cost}
                       </>
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}



