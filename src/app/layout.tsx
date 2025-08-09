
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Lexend } from 'next/font/google'
import AuthProvider from "@/app/Providers/AuthProvider";
import { Header } from '@/components/Header';

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
})


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
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
