import React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LeaderboardDashboard } from '@/components/dashboard/LeaderboardDashboard';

export function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <LeaderboardDashboard />
      </div>
    </TooltipProvider>
  );
}

export default App;
