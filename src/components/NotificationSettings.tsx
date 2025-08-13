'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { useUserSettings } from '@/hooks/useUserSettings';
import { Loader2, Bell } from 'lucide-react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

export default function NotificationSettings() {
  const { settings, updateSettings, loading } = useUserSettings();

  const handleToggle = (key: string, value: boolean) => {
    if (!settings) return;

    const updatedNotifications = {
      ...settings.notifications,
      [key]: value,
    };
    updateSettings({ notifications: updatedNotifications });
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
          <CardTitle className="flex items-center gap-2"><Bell />Notifications</CardTitle>
          <CardDescription>
            Choose how you want to be notified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="inAppAlerts" className="flex-1 cursor-pointer">
                    In-App Alerts
                </Label>
                <Switch
                    id="inAppAlerts"
                    checked={settings.notifications.inAppAlerts}
                    onCheckedChange={(checked) => handleToggle('inAppAlerts', checked)}
                />
            </div>
            <Separator />
             <h4 className="font-semibold text-muted-foreground pt-2">Email Notifications</h4>
             <div className="flex items-center justify-between">
                <Label htmlFor="emailProgressSummary" className="flex-1 cursor-pointer">
                    Daily Progress Summary
                </Label>
                <Switch
                    id="emailProgressSummary"
                    checked={settings.notifications.emailProgressSummary}
                    onCheckedChange={(checked) => handleToggle('emailProgressSummary', checked)}
                />
            </div>
             <div className="flex items-center justify-between">
                <Label htmlFor="emailStreakReminders" className="flex-1 cursor-pointer">
                    Streak Reminders
                </Label>
                <Switch
                    id="emailStreakReminders"
                    checked={settings.notifications.emailStreakReminders}
                    onCheckedChange={(checked) => handleToggle('emailStreakReminders', checked)}
                />
            </div>
             <div className="flex items-center justify-between">
                <Label htmlFor="emailPowerUpAnnouncements" className="flex-1 cursor-pointer">
                    New Power-Up Announcements
                </Label>
                <Switch
                    id="emailPowerUpAnnouncements"
                    checked={settings.notifications.emailPowerUpAnnouncements}
                    onCheckedChange={(checked) => handleToggle('emailPowerUpAnnouncements', checked)}
                />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}



