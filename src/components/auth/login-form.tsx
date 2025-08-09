// at the very top of src/components/auth/login-form.tsx
"use client";

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/app/Providers/AuthProvider';
import { useRouter } from 'next/navigation';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .333 5.393.333 12.16s5.534 12.16 12.147 12.16c3.267 0 6.027-1.12 8.04-3.16 2.04-2.04 2.6-5.12 2.6-8.32 0-.667-.067-1.333-.16-2z" fill="#4285F4"></path>
    </svg>
  );

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Apple</title>
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.028-3.91 1.188-4.96 2.96-.98 1.708-1.243 4.148-.24 6.21.84 1.74 2.333 3.354 4.041 3.413 1.615.082 2.353-.98 4.29-1.01 1.928-.04 2.48 1.01 4.322 1.01 1.638 0 2.946-1.511 3.918-3.246.546-1.028.69-2.284.72-3.834-.027-2.23-1.04-4.223-2.97-4.432-1.47-.18-3.32.78-4.21.822-.89.027-2.11-.98-3.88-.98zM10.23 0c.016 1.03.628 2.3 1.23 3.103.79 1.01 1.86 1.662 2.673 1.662s1.51-.572 2.44-1.511C17.525 2.155 18.028.92 18.028.92c-.06 3.012-2.36 4.41-4.72 4.453-1.92.054-3.56-1.254-4.41-2.934C8.47 1.63 8.31.956 8.31.956c.645.04 1.28.29 1.92.028z"/>
    </svg>
);

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      router.push("/home");
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: `Error: ${err.code || err.message}`,
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
        await signInWithGoogle();
        router.push("/home");
    } catch (error: any) {
        toast({
            title: "Sign in Failed",
            description: error.message,
            variant: "destructive",
            });
    }
  }

  const handleAppleLogin = async () => {
    try {
        await signInWithApple();
        router.push("/home");
    } catch (error: any) {
        toast({
            title: "Sign in Failed",
            description: error.message,
            variant: "destructive",
            });
    }
  }

  return (
    <Card className="w-full max-w-sm bg-card border-border">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your email below to login to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
        <div className="my-4 flex items-center">
          <Separator className="flex-1" />
          <span className="mx-4 text-xs text-muted-foreground">OR CONTINUE WITH</span>
          <Separator className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
                <GoogleIcon className="mr-2 h-4 w-4" />
                Google
            </Button>
            <Button variant="outline" className="w-full" onClick={handleAppleLogin}>
                <AppleIcon className="mr-2 h-4 w-4" />
                Apple
            </Button>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-center text-sm text-muted-foreground w-full">
            Don't have an account?{" "}
            <Link href="/signup" className="text-sm underline hover:text-primary">
              Sign up
            </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
