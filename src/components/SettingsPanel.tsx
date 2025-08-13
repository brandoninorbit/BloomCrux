'use client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import ProfileSettings from "./ProfileSettings";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import NotificationSettings from "./NotificationSettings";
import AppearanceSettings from './AppearanceSettings';
import StudyDefaultsSettings from "./StudyDefaultsSettings";
import PrivacySettings from "./PrivacySettings";
import AccessibilitySettings from "./AccessibilitySettings";
import DataExportSettings from "./DataExportSettings";

interface SettingsPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto">
            <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
                <SheetDescription>
                    Manage your account settings, preferences, and more.
                </SheetDescription>
            </SheetHeader>
            <div className="py-8">
              <Accordion type="multiple" className="w-full" defaultValue={['item-1']}>
                <AccordionItem value="item-1">
                  <AccordionTrigger>Profile and Account</AccordionTrigger>
                  <AccordionContent>
                    <ProfileSettings />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Study Defaults</AccordionTrigger>
                  <AccordionContent>
                    <StudyDefaultsSettings />
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                  <AccordionTrigger>Notifications</AccordionTrigger>
                  <AccordionContent>
                    <NotificationSettings />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Appearance &amp; Interface</AccordionTrigger>
                  <AccordionContent>
                    <AppearanceSettings />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>Accessibility</AccordionTrigger>
                  <AccordionContent>
                    <AccessibilitySettings />
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-6">
                  <AccordionTrigger>Data &amp; Export</AccordionTrigger>
                  <AccordionContent>
                    <DataExportSettings />
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-7">
                  <AccordionTrigger>Privacy &amp; Security</AccordionTrigger>
                  <AccordionContent>
                    <PrivacySettings />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
        </SheetContent>
    </Sheet>
  );
}




