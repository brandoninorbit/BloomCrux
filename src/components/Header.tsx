
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle, Search, LogOut, Coins, Store, Upload, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import React, { useEffect, useState, useRef } from 'react';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserPowerUps, SelectedCustomizations } from '@/types';
import { getUserCustomizations, uploadProfilePhotoAndUpdateAuth } from '@/lib/firestore';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import SettingsButton from './SettingsButton';
import { useUserSettings } from '@/hooks/useUserSettings';
import { avatarFrames } from '@/config/avatarFrames';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function Header() {
  const pathname = usePathname();
  const { user, logOut } = useUserAuth();
  const { settings } = useUserSettings();
  const [customizations, setCustomizations] = useState<SelectedCustomizations | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubscribe = getUserCustomizations(user.uid, (c) => setCustomizations(c));
    
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [user?.uid]);

  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/decks', label: 'Decks' },
    { href: '/dashboard', label: 'Progress' },
    { href: '/shop', label: 'Shop' },
  ];

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  
  const activeFrameData = customizations?.activeAvatarFrame ? avatarFrames[customizations.activeAvatarFrame] : null;

  const ActiveFrame = () => {
    if (!activeFrameData || customizations?.activeAvatarFrame === 'default') {
      return null;
    }
    return <div className={cn("absolute inset-0 pointer-events-none rounded-full", activeFrameData.className)} />;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="https://stitchstudy.web.app/logo.svg" alt="BloomCrux Logo" width={48} height={48} />
            <span className="font-bold text-xl">BloomCrux</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className={cn(
                'transition-colors text-muted-foreground hover:text-foreground',
                pathname === '/' && 'text-foreground font-semibold'
              )}
            >
              About
            </Link>
            {navItems.map((item) => {
              const isActive = item.href === '/home' ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'transition-colors text-muted-foreground hover:text-foreground',
                    isActive && 'text-foreground font-semibold'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-5 w-5" />
          </Button>

          {user ? (
            <TooltipProvider>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-12 w-12 rounded-full">
                         <Avatar className="h-12 w-12">
                            <AvatarImage src={user.photoURL || "https://placehold.co/100x100.png"} alt="User avatar" data-ai-hint="profile" className="object-cover" />
                            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <ActiveFrame />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  {activeFrameData && <TooltipContent><p>{activeFrameData.name}</p></TooltipContent>}
                </Tooltip>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <SettingsButton />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
