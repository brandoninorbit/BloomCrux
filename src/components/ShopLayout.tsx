
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Store, User } from 'lucide-react';
import Image from 'next/image';

interface ShopLayoutProps {
    title: string;
    children: React.ReactNode;
    character?: string;
}

const ShopLayout = ({ title, children, character }: ShopLayoutProps) => {
    return (
        <main className="container mx-auto max-w-4xl p-4 py-8">
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-4 mb-2">
                   {character ? (
                     <Image src={character} alt={title} width={48} height={48} className="rounded-full h-12 w-12 object-cover" />
                   ) : (
                     <Store className="h-8 w-8 text-muted-foreground" />
                   )}
                   <h1 className="text-3xl font-headline">{title}</h1>
                </div>
                <p className="text-muted-foreground font-body max-w-xl mx-auto">Spend your hard-earned tokens on powerful upgrades and boosts.</p>
            </div>
            <Card className="border-dashed">
                <CardContent className="p-6">
                    {children}
                </CardContent>
            </Card>
        </main>
    );
};

export default ShopLayout;


