import React from 'react';
import { Sheet } from './ui/Sheet';
import { Badge } from './ui/Badge';
import { Terminal, Shield, Zap, Flame, Swords } from 'lucide-react';

interface CombatLogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: string[];
}

export const CombatLogDrawer: React.FC<CombatLogDrawerProps> = ({
  open,
  onOpenChange,
  logs,
}) => {
  const getBadgeForLog = (text: string) => {
    if (text.includes('GUARD SHATTER') || text.includes('STAGGER BREAK')) {
      return <Badge variant="crimson">BREAK</Badge>;
    }
    if (text.includes('PARRY')) {
      return <Badge variant="solar">PARRY</Badge>;
    }
    if (text.includes('BLOCKED')) {
      return <Badge variant="cyan">BLOCK</Badge>;
    }
    if (text.includes('CRITICAL')) {
      return <Badge variant="crimson">CRIT</Badge>;
    }
    if (text.includes('DoT') || text.includes('Burn')) {
      return <Badge variant="purple">DOT</Badge>;
    }
    return <Badge variant="default">EVENT</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="CALDERA COMBAT TELEMETRY LOG" side="right">
      <div className="flex flex-col gap-2.5 font-mono text-xs">
        <div className="flex items-center gap-2 p-2 rounded bg-magma-900 border border-magma-800 text-[11px] text-text-muted">
          <Terminal className="w-4 h-4 text-solar-gold" />
          <span>AUTHORITATIVE MATCH AUDIT TRAIL</span>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
          {logs.map((log, index) => (
            <div
              key={index}
              className="p-2.5 rounded bg-magma-900/80 border border-magma-800 hover:border-ember-orange/40 transition-colors flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-[10px] text-text-muted">
                <span>EVENT #{logs.length - index}</span>
                {getBadgeForLog(log)}
              </div>
              <p className="text-text-primary text-xs leading-relaxed font-chakra">
                {log}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
};
