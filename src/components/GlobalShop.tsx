
'use client';

import React from 'react';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import { getShopItems, purchaseShopItem } from '@/lib/firestore';
import type { ShopItem } from '@/types';
import { Loader2 } from 'lucide-react';
import ShopItemCard from './ShopItemCard';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/useUserSettings';
import PowerUpInventory from './PowerUpInventory';

const GlobalShop = () => {
    const { user } = useUserAuth();
    const { toast } = useToast();
    const { settings, loading: settingsLoading } = useUserSettings();
    const [items, setItems] = React.useState<ShopItem[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchShopData = async () => {
            setLoading(true);
            try {
                const shopItems = await getShopItems(); // Fetch global items
                setItems(shopItems);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load shop data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchShopData();
    }, [user, toast]);

    const handlePurchase = async (item: ShopItem) => {
        if (!user) return;
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
    

    if (loading || settingsLoading) {
        return <Loader2 className="mx-auto h-8 w-8 animate-spin" />;
    }
    
    return (
        <div className="space-y-8">
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
