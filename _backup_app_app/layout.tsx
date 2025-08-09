
"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation'
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/app/Providers/AuthProvider";


function UserNav() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (!user) {
        return (
            <Button asChild>
                <Link href="/login">Login</Link>
            </Button>
        );
    }
    
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || "https://placehold.co/100x100.png"} alt={user.displayName || "User"} data-ai-hint="user avatar" />
            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
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
        <DropdownMenuItem onClick={handleSignOut}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MainNav() {
    const pathname = usePathname()
    const navLinks = [
        { href: '/app/decks', label: 'Decks' },
        { href: '/app/dashboard', label: 'Dashboard' },
        { href: '/', label: 'About' },
    ]
    return (
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            {navLinks.map(link => (
                 <Link 
                    key={link.href}
                    href={link.href} 
                    className={cn("text-muted-foreground hover:text-primary transition-colors", {
                        "text-primary": pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                    })}
                >
                    {link.label}
                </Link>
            ))}
        </nav>
    )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // useEffect(() => {
    //     if (!loading && !user) {
    //         router.push('/login');
    //     }
    // }, [user, loading, router]);

    // if (loading || !user) {
    //     return (
    //         <div className="flex items-center justify-center min-h-screen">
    //             <p>Loading...</p>
    //         </div>
    //     );
    // }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/app/decks" className="flex items-center gap-2 text-2xl font-bold text-primary font-headline tracking-wider">
                <Image src="https://firebasestorage.googleapis.com/v0/b/bloomcrux.firebasestorage.app/o/BloomCrux%20logo.png?alt=media&token=d86c90af-2186-4d28-95ed-be594b54ed30" alt="BloomCrux Logo" width={64} height={64} />
                BloomCrux
            </Link>
            <MainNav />
          </div>
          <UserNav />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
