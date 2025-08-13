'use client';
import { Button } from "@/components/ui/button";
import { useState } from "react";
import SettingsPanel from "./SettingsPanel";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { Settings } from "lucide-react";

export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpen(true); }}>
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>
      <SettingsPanel open={open} onOpenChange={setOpen} />
    </>
  );
}



