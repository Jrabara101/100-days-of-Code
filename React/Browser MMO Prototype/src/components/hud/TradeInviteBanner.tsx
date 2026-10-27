import React from 'react';
import { ArrowRightLeft, Check, X } from 'lucide-react';

interface TradeInviteBannerProps {
  invite: { tradeId: string; initiatorId: string; initiatorName: string } | null;
  onRespond: (tradeId: string, accept: boolean) => void;
}

export const TradeInviteBanner: React.FC<TradeInviteBannerProps> = ({
  invite,
  onRespond,
}) => {
  if (!invite) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0B0F19]/95 backdrop-blur-md border border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-in slide-in-from-top duration-200 select-none">
      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
        <ArrowRightLeft className="w-5 h-5 animate-pulse" />
      </div>

      <div>
        <p className="text-xs font-bold text-slate-100">Trade Request Received</p>
        <p className="text-[11px] text-slate-400">
          <span className="text-amber-400 font-semibold">{invite.initiatorName}</span> wants to open a trade chamber with you.
        </p>
      </div>

      <div className="flex items-center gap-1.5 ml-2">
        <button
          onClick={() => onRespond(invite.tradeId, true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Accept</span>
        </button>

        <button
          onClick={() => onRespond(invite.tradeId, false)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition active:scale-95 shadow"
        >
          <X className="w-3.5 h-3.5" />
          <span>Decline</span>
        </button>
      </div>
    </div>
  );
};
