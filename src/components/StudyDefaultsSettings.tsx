const bloomOrder = ["Remember","Understand","Apply","Analyze","Evaluate","Create"] as const;

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { useUserSettings } from '@/hooks/useUserSettings';
import { Loader2, BookOpen, Clock, Image as ImageIcon } from 'lucide-react';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";

export default function StudyDefaultsSettings() {
  const { settings, updateSettings, loading } = useUserSettings();

  const handleUpdate = (path: string, value: any) => {
    if (!settings) return;

    // Deep merge/update logic
    const newSettings = JSON.parse(JSON.stringify(settings));
    const keys = path.split('.');
    let current = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = current[keys[i]] || {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    updateSettings(newSettings);
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
          <CardTitle className="flex items-center gap-2"><BookOpen />Study Options</CardTitle>
          <CardDescription>Set your default preferences for study sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bloomFilter">Default Bloom Level</Label>
            <Select
              value={settings.studyDefaults.bloomFilter}
              onValueChange={(value) => handleUpdate('studyDefaults.bloomFilter', value)}
            >
              <SelectTrigger id="bloomFilter">
                <SelectValue placeholder="Select a level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {bloomOrder.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Default Deck Cover</Label>
            <div className="p-4 text-center text-sm text-muted-foreground border-2 border-dashed rounded-md mt-2">
                <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                <p>Deck cover selection coming soon.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock />Timed Drills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultTime">Default time per card (sec)</Label>
            <Input
              id="defaultTime"
              type="number"
              value={settings.studyDefaults.timedDrill.defaultTime}
              onChange={(e) => handleUpdate('studyDefaults.timedDrill.defaultTime', parseInt(e.target.value, 10) || 30)}
              className="w-24"
            />
             <p className="text-xs text-muted-foreground">Only applies when cards require extra time—this won’t bypass timed modes.</p>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="autoAdvance" className="cursor-pointer">
              Auto-advance after time expires
            </Label>
            <Switch
              id="autoAdvance"
              checked={settings.studyDefaults.timedDrill.autoAdvance}
              onCheckedChange={(checked) => handleUpdate('studyDefaults.timedDrill.autoAdvance', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





