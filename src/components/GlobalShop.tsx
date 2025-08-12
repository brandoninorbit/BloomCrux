
'use client';

import React from 'react';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import { purchaseShopItem } from '@/lib/firestore'; // Removed getShopItems
import type { ShopItem } from '@/stitch/types';
import { Loader2 } from 'lucide-react';
import ShopItemCard from './ShopItemCard';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/useUserSettings';
import PowerUpInventory from './PowerUpInventory';
import { GLOBAL_SHOP_ITEMS } from '@/lib/shop-items';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info } from 'lucide-react';
import Link from 'next/link';

const GlobalShop = () => {
    const { user } = useUserAuth();
    const { toast } = useToast();
    const { settings, loading: settingsLoading } = useUserSettings();
    // The component now directly uses the imported constant.
    const items = GLOBAL_SHOP_ITEMS as ShopItem[];

    const handlePurchase = async (item: ShopItem) => {
        if (!user) {
            toast({
                title: 'Login Required',
                description: 'You must be logged in to make purchases.',
                variant: 'destructive',
            });
            return;
        };
        try {
            await purchaseShopItem(user.uid, item);
            toast({
                title: 'Purchase Successful!',
                description: `You've acquired the ${item.name} power-up.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Purchase Failed',
                description: error.message,
            });
        }
    };
    

    if (settingsLoading) {
        return <Loader2 className="mx-auto h-8 w-8 animate-spin" />;
    }
    
    return (
        <div className="space-y-8">
            {!user && (
                 <Alert variant="default" className="bg-blue-50 border-blue-200">
                    <Info className="h-5 w-5 text-blue-700" />
                    <AlertTitle className="text-blue-800 font-semibold">Viewing Mock Data</AlertTitle>
                    <AlertDescription className="text-blue-700">
                    This is a preview of the shop. Please <Link href="/login" className="font-bold underline">log in</Link> to make purchases.
                    </AlertDescription>
                </Alert>
            )}
            <PowerUpInventory />
            
            {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <ShopItemCard
                            key={item.id}
                            item={item}
                            tokens={settings?.tokens || 0}
                            onPurchase={handlePurchase}
                        />
                    ))}
                </div>
            ) : (
                 <p className="text-muted-foreground text-center">The Emporium is currently empty. Check back later!</p>
            )}
        </div>
    );
};

export default GlobalShop;
