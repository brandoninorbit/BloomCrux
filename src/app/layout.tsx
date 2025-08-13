export const dynamic = 'force-dynamic';
export const revalidate = 0;


import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Lexend } from 'next/font/google'
import { Header } from '@/components/Header';


const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
})
import ClientProviders from './ClientProviders';

export const metadata: Metadata = {
  title: 'BloomCrux',
  description: 'A gamified flashcard app for effective learning.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-body antialiased", lexend.variable)}>
        <ClientProviders>
          <Header />
          {children}
        </ClientProviders>
        <Toaster />
      </body>
    </html>
  );
}


