
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>Google</title>
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .333 5.393.333 12.16s5.534 12.16 12.147 12.16c3.267 0 6.027-1.12 8.04-3.16 2.04-2.04 2.6-5.12 2.6-8.32 0-.667-.067-1.333-.16-2z"
      fill="#4285F4"
    ></path>
  </svg>
);

export function LoginForm() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/app/decks");
  };

  if (!isClient) {
    return null; // Or a loading spinner
  }

  return (
    <Card className="w-full max-w-sm bg-card border-border">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your email below to login to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
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
        <Button variant="outline" className="w-full" onClick={handleLogin}>
          <GoogleIcon className="mr-2 h-4 w-4" />
          Google
        </Button>
      </CardContent>
      <CardFooter>
        <p className="text-center text-sm text-muted-foreground w-full">
            Don't have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/signup">Sign up</Link>
            </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
