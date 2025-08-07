"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils";


function UserNav() {
  // In a real app, this would get user data from a context or hook
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://placehold.co/100x100.png" alt="@user" data-ai-hint="user avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">User</p>
            <p className="text-xs leading-none text-muted-foreground">
              user@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">Log out</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MainNav() {
    const pathname = usePathname()
    const navLinks = [
        { href: '/', label: 'About' },
        { href: '/app/decks', label: 'Decks' },
        { href: '/app/dashboard', label: 'Dashboard' },
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
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/app/decks" className="text-2xl font-bold text-primary font-headline tracking-wider">
                <ShieldCheck className="inline-block mr-2" />
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
