'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { useUserSettings } from '@/hooks/useUserSettings';
import { Loader2, Palette, Text, Film, Music, RotateCcw } from 'lucide-react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import AvatarFramePicker from './AvatarFramePicker';
import { useUserAuth } from '@/app/Providers/AuthProvider';

const DEFAULT_ACCENT_COLOR = "#73A9AD";

export default function AppearanceSettings() {
  const { settings, updateSettings, loading, customizations, saveSelectedCustomizations } = useUserSettings();
  const { user } = useUserAuth();

  useEffect(() => {
    if (settings?.appearance) {
      const { theme, accentColor } = settings.appearance;

      const body = document.body;
      body.classList.remove('light', 'dark');
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        body.classList.add(systemTheme);
      } else {
        body.classList.add(theme);
      }
      
      function hexToHsl(hex: string): string | null {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return null;

        let r = parseInt(result[1], 16) / 255;
        let g = parseInt(result[2], 16) / 255;
        let b = parseInt(result[3], 16) / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        const h_final = Math.round(h * 360);
        const s_final = Math.round(s * 100);
        const l_final = Math.round(l * 100);

        return `${h_final} ${s_final}% ${l_final}%`;
      }
      
      const hslString = hexToHsl(accentColor);
      if(hslString) {
        document.documentElement.style.setProperty('--primary', hslString);
        document.documentElement.style.setProperty('--ring', hslString);
      }
    }
  }, [settings?.appearance]);

  useEffect(() => {
    if (settings?.accessibility) {
        document.body.classList.toggle('reduce-motion', settings.accessibility.reduceMotion);
        document.documentElement.classList.toggle('high-contrast', settings.accessibility.highContrast);
        document.body.classList.toggle('focus-highlight', settings.accessibility.focusHighlight);
        
        if (settings.accessibility.screenReaderMode) {
            document.documentElement.classList.toggle("screen-reader-mode", true);
        } else {
            document.documentElement.classList.toggle("screen-reader-mode", false);
        }
    }
  }, [settings?.accessibility]);

  const handleUpdate = (path: string, value: any) => {
    if (!settings) return;

    // A bit of a hacky way to handle nested updates without a full deep-merge library
    const newSettings = JSON.parse(JSON.stringify(settings));

    const keys = path.split('.');
    let current = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    updateSettings(newSettings);
  };
  
  const handleSelectFrame = (frameKey: string) => {
    if(user) {
        saveSelectedCustomizations({ activeAvatarFrame: frameKey });
    }
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
          <CardTitle className="flex items-center gap-2"><Palette />Theme &amp; Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <Label>Theme</Label>
              <RadioGroup
                value={settings.appearance.theme}
                onValueChange={(value) => handleUpdate('appearance.theme', value)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Label htmlFor="theme-system">System</Label>
                </div>
              </RadioGroup>
            </div>
             <div className="space-y-2">
                <Label htmlFor="accentColor">Primary Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                      type="color"
                      id="accentColor"
                      value={settings.appearance.accentColor}
                      onChange={(e) => handleUpdate('appearance.accentColor', e.target.value)}
                      className="w-10 h-10 p-1 bg-background border rounded-md cursor-pointer"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUpdate('appearance.accentColor', DEFAULT_ACCENT_COLOR)}
                    aria-label="Reset to default color"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
            </div>
            <Separator />
            {customizations && customizations.avatarFrames && customizations.avatarFrames.length > 0 && (
                <AvatarFramePicker
                    unlocked={customizations.avatarFrames}
                    active={customizations.activeAvatarFrame}
                    onSelect={handleSelectFrame}
                />
            )}
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Text />Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <Label>Font Size</Label>
              <Slider
                value={[settings.appearance.fontSize]}
                onValueChange={(value) => handleUpdate('appearance.fontSize', value[0])}
                min={0.8}
                max={1.2}
                step={0.01}
              />
               <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Small</span>
                <span>Default</span>
                <span>Large</span>
              </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Film />Animations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between">
                <Label htmlFor="flipAnim" className="flex-1 cursor-pointer">
                    Enable Card Flip Animations
                </Label>
                <Switch
                    id="flipAnim"
                    checked={settings.appearance.cardAnimations.flip}
                    onCheckedChange={(checked) => handleUpdate('appearance.cardAnimations.flip', checked)}
                />
            </div>
            <div>
              <Label>Animation Speed</Label>
              <Slider
                value={[settings.appearance.cardAnimations.speed]}
                onValueChange={(value) => handleUpdate('appearance.cardAnimations.speed', value[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                disabled={!settings.appearance.cardAnimations.flip}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Slower</span>
                <span>Faster</span>
              </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Music />Sound Effects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="flipSound" className="flex-1 cursor-pointer">Card Flip Sound</Label>
                <Switch id="flipSound" checked={settings.appearance.soundEffects.flip} onCheckedChange={(c) => handleUpdate('appearance.soundEffects.flip', c)} />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="correctSound" className="flex-1 cursor-pointer">Correct-Answer Chime</Label>
                <Switch id="correctSound" checked={settings.appearance.soundEffects.correctChime} onCheckedChange={(c) => handleUpdate('appearance.soundEffects.correctChime', c)} />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="incorrectSound" className="flex-1 cursor-pointer">Incorrect-Answer Chime</Label>
                <Switch id="incorrectSound" checked={settings.appearance.soundEffects.incorrectChime} onCheckedChange={(c) => handleUpdate('appearance.soundEffects.incorrectChime', c)} />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

