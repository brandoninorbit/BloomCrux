// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import AuthProvider from "@/app/Providers/AuthProvider"; // adjust if you moved it
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "BloomCrux",
  description: "A gamified flashcard app for effective learning.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
