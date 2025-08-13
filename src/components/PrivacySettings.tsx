'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { useUserSettings } from '@/hooks/useUserSettings';
import { Loader2, Shield, FileLock, Trash2 } from 'lucide-react';
import { Label } from './ui/label';
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";

export default function PrivacySettings() {
  const { settings, updateSettings, loading } = useUserSettings();

  const handleToggle = (key: string, value: boolean) => {
    if (!settings) return;

    const updatedPrivacy = { ...settings.privacy, [key]: value };
    updateSettings({ privacy: updatedPrivacy });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileLock />Data &amp; Privacy</CardTitle>
          <CardDescription>Manage how your data is used.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <div className="flex-1 pr-4">
              <Label htmlFor="dataSharing" className="font-semibold">Allow anonymized usage statistics</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Help us improve BloomCrux by allowing us to collect anonymous data about feature usage and performance. Your personal data is never shared.
              </p>
            </div>
            <Switch
              id="dataSharing"
              checked={settings.privacy.dataSharing}
              onCheckedChange={(checked) => handleToggle('dataSharing', checked)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trash2 />Account Management</CardTitle>
          <CardDescription>Manage your account data and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
            <Button variant="outline" disabled>Manage Active Sessions</Button>
            <p className="text-xs text-muted-foreground mt-1">Remotely log out of other devices. (Coming soon)</p>
          </div>
           <div>
            <Button variant="destructive" disabled>Delete Account</Button>
            <p className="text-xs text-muted-foreground mt-1">Permanently delete your account and all associated data. (Coming soon)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



