import React from 'react';
import { useContactStore } from '../store/useContactStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/Sheet';
import { Activity, CheckCircle2, RotateCcw, Clock } from 'lucide-react';
import { formatMs } from '../lib/utils';

interface MutationPipelineDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MutationPipelineDrawer: React.FC<MutationPipelineDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const mutationStream = useContactStore((state) => state.mutationStream);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-surface-container-low border-l border-outline-variant/30 flex flex-col p-0"
      >
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container/60 shrink-0">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-tertiary" />
              <div>
                <SheetTitle className="text-base font-bold font-sans">
                  Mutation Pipeline & Vector Log
                </SheetTitle>
                <SheetDescription className="text-xs text-outline font-mono">
                  Live record of in-memory mutations and netcode reconciliation.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {mutationStream.map((record) => (
            <div
              key={record.id}
              className={`p-3 rounded-xl border transition-all text-xs font-mono ${
                record.status === 'ROLLED_BACK'
                  ? 'bg-error-container/20 border-error/40 text-error'
                  : 'bg-surface-container/70 border-outline-variant/20 text-on-surface'
              }`}
            >
              <div className="flex items-center justify-between pb-1 mb-1 border-b border-outline-variant/20">
                <span className="font-bold truncate max-w-[200px] text-tertiary">
                  {record.tx}
                </span>
                <span className="text-[10px] text-outline flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {record.timestamp}
                </span>
              </div>

              <div className="text-[11px] text-on-surface-variant font-sans">
                {record.details}
              </div>

              <div className="flex items-center justify-between pt-1.5 mt-1.5 text-[10px] text-outline">
                <span className="flex items-center gap-1">
                  {record.status === 'ROLLED_BACK' ? (
                    <>
                      <RotateCcw className="w-3 h-3 text-error" />
                      <span className="text-error font-bold">ROLLED BACK</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-tertiary" />
                      <span className="text-tertiary font-bold">COMMITTED</span>
                    </>
                  )}
                </span>
                <span className="text-primary font-mono">
                  Δ {formatMs(record.latencyMs)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
