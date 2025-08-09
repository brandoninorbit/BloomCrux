
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { useUserAuth } from "@/app/Providers/AuthProvider";
import { getDb } from "@/lib/firebase";
import { collection, getDocs, deleteDoc } from "firebase/firestore";
import { useCallback } from "react";

export default function DataExportSettings() {
  const { user } = useUserAuth();
  const db = getDb();

  const handleExport = useCallback((format: "csv" | "json") => {
    console.log(`EXPORT PROGRESS as ${format} triggered`);
    alert('Export functionality is not fully implemented yet.');
  }, []);

  const handleReset = useCallback(() => {
    if (!confirm("This will clear all streaks and accuracy history. Continue?")) return;
    console.log("RESET LEARNING STATS triggered");
    alert('Stats reset functionality is not fully implemented yet.');
  }, []);

  const handleClear = useCallback(() => {
    if (!confirm("This will reload the app and clear cached assets. Continue?")) return;
    console.log("CLEAR CACHE triggered");
    window.location.reload();
  }, []);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download />Data &amp; Export</CardTitle>
          <CardDescription>Manage your personal data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant="outline" onClick={() => handleExport('csv')} disabled>
              Export Progress Data (CSV)
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Feature coming soon.</p>
          </div>
           <div>
            <Button variant="outline" onClick={() => handleExport('json')} disabled>
              Export Progress Data (JSON)
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Feature coming soon.</p>
          </div>
          <div>
            <Button variant="destructive" onClick={handleReset} disabled>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Learning Stats
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Feature coming soon.</p>
          </div>
          <div>
            <Button variant="destructive" onClick={handleClear} disabled>
              <Trash2 className="mr-2 h-4 w-4" /> Clear Local Cache
            </Button>
             <p className="text-xs text-muted-foreground mt-1">Feature coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
