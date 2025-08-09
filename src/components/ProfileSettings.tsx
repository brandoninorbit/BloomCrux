
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { useUserSettings } from '@/hooks/useUserSettings';
import { useUserAuth } from '@/context/AuthContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Loader2, KeyRound, Link as LinkIcon, User, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { uploadProfilePhotoAndUpdateAuth } from '@/lib/firestore';

export default function ProfileSettings() {
  const { user, forceReloadUser } = useUserAuth();
  const { settings, updateSettings, loading } = useUserSettings();
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName || '');
    }
  }, [settings]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName });
      await updateSettings({ displayName });

      toast({
        title: 'Success',
        description: 'Your profile has been updated.',
      });
      forceReloadUser();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update profile: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Ã°Å¸â€â€ handleFileChange fired", event.target.files);
    const file = event.target.files?.[0];
    console.log("Ã°Å¸â€â€ selected file:", file);
    if (file && user) {
      toast({ title: 'Uploading...', description: 'Your new photo is being uploaded.' });
      try {
        console.log("Ã°Å¸â€â€ calling uploadProfilePhotoAndUpdateAuth");
        const freshUser = await uploadProfilePhotoAndUpdateAuth(user, file);
        console.log("Ã°Å¸â€â€ upload complete, freshUser.photoURL =", freshUser.photoURL);
        toast({ title: 'Success!', description: 'Your profile photo has been updated.' });
        console.log("Ã°Å¸â€â€ calling forceReloadUser");
        await forceReloadUser();
        console.log("Ã°Å¸â€â€ forceReloadUser done, context user.photoURL =", user?.photoURL);
      } catch (err: any) {
        console.error("Ã°Å¸â€â€ upload error", err);
        toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User />Profile</CardTitle>
          <CardDescription>
            This information will be displayed on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled />
          </div>
           <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
        </CardContent>
      </Card>
      
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon />Profile Photo</CardTitle>
            <CardDescription>Update your avatar.</CardDescription>
         </CardHeader>
         <CardContent className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.photoURL || "https://placehold.co/100x100.png"} alt="User avatar" className="object-cover" />
              <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button variant="outline" onClick={handleUploadClick}>
              Upload New Photo
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
            />
         </CardContent>
      </Card>

      <Card>
         <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound />Password</CardTitle>
          <CardDescription>Change your password.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="outline" disabled>Change Password</Button>
            <p className="text-xs text-muted-foreground mt-2">Password change functionality is coming soon.</p>
        </CardContent>
      </Card>

       <Card>
         <CardHeader>
          <CardTitle className="flex items-center gap-2"><LinkIcon />Linked Accounts</CardTitle>
          <CardDescription>Manage your connected social accounts.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="outline" disabled>Connect Google Account</Button>
             <p className="text-xs text-muted-foreground mt-2">Account linking is coming soon.</p>
        </CardContent>
      </Card>
      
       <Card>
         <CardHeader>
          <CardTitle>Subscription & Tokens</CardTitle>
          <CardDescription>Manage your subscription and token balance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 rounded-md bg-muted border flex justify-between items-center">
                <span className="font-medium">Token Balance</span>
                <span className="font-bold text-lg text-primary">{settings?.tokens || 0}</span>
            </div>
            <Button disabled>Purchase More Tokens</Button>
             <p className="text-xs text-muted-foreground mt-2">Token purchasing is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}


