'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { useUserSettings } from '@/hooks/useUserSettings';
import { Loader2, Eye, Ear, Hand, ZoomIn } from 'lucide-react';
import { Label } from './ui/label';
import { Switch } from "./ui/switch";

export default function AccessibilitySettings() {
  const { settings, updateSettings, loading } = useUserSettings();

  const handleToggle = (key: string, value: boolean) => {
    if (!settings) return;

    const updatedAccessibility = { ...settings.accessibility, [key]: value };
    updateSettings({ accessibility: updatedAccessibility });
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
          <CardTitle className="flex items-center gap-2"><Eye />Accessibility</CardTitle>
          <CardDescription>Customize the interface to suit your needs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <Label htmlFor="reduceMotion" className="flex-1 cursor-pointer">Reduce Motion</Label>
            <Switch
              id="reduceMotion"
              checked={settings.accessibility.reduceMotion}
              onCheckedChange={(checked) => handleToggle('reduceMotion', checked)}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <Label htmlFor="highContrast" className="flex-1 cursor-pointer">High-Contrast Mode</Label>
            <Switch
              id="highContrast"
              checked={settings.accessibility.highContrast}
              onCheckedChange={(checked) => handleToggle('highContrast', checked)}
              disabled // Feature coming soon
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <Label htmlFor="screenReaderMode" className="flex-1 cursor-pointer">Screen Reader Mode</Label>
            <Switch
              id="screenReaderMode"
              checked={settings.accessibility.screenReaderMode}
              onCheckedChange={(checked) => handleToggle('screenReaderMode', checked)}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <Label htmlFor="focusHighlight" className="flex-1 cursor-pointer">Focus Highlight</Label>
            <Switch
              id="focusHighlight"
              checked={settings.accessibility.focusHighlight}
              onCheckedChange={(checked) => handleToggle('focusHighlight', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



