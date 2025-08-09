
'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the client-side component with the charts.
const DashboardClient = dynamic(() => import('@/components/DashboardClient'), {
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  ),
  // No server-side rendering for this component as it relies on client-side data fetching
  ssr: false, 
});


export default function DashboardPage() {
  // This page is now a Client Component, allowing it to dynamically 
  // load another client-side-only component with ssr:false.
  return (
    <DashboardClient />
  );
}



