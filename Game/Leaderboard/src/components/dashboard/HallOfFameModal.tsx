import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  History, 
  Users, 
  Sparkles,
  Calendar
} from 'lucide-react';
import { HALL_OF_FAME_SEASONS } from '@/services/mockDataGenerator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatScore } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface HallOfFameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HallOfFameModal: React.FC<HallOfFameModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto border border-border/80 bg-slate-950 p-6 shadow-2xl">
        
        <DialogHeader className="mb-4 text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white">
                HALL OF FAME & SEASONAL ARCHIVES
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Preserving championship legacies and immortalizing tournament victors across all seasons
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* List of Historic Seasons */}
        <div className="space-y-4">
          {HALL_OF_FAME_SEASONS.map((season) => (
            <div
              key={season.id}
              className="group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 p-5 shadow-lg transition-all hover:border-amber-400/50"
            >
              {/* Season Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white">
                      {season.name}
                    </span>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/30">
                      {season.badge}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {season.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {season.endDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    {season.totalParticipants.toLocaleString()} contenders
                  </span>
                </div>
              </div>

              {/* Champion Feature Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                
                {/* 1st Place */}
                <div className="sm:col-span-2 flex items-center gap-3.5 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3.5 shadow-sm">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-amber-400 shadow-lg">
                      <AvatarImage src={season.champion.avatarUrl} alt={season.champion.username} />
                      <AvatarFallback className="bg-amber-900 text-amber-300 font-bold">
                        {season.champion.username.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-0.5 text-slate-950 shadow">
                      <Crown className="h-3.5 w-3.5 fill-slate-950" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-white truncate">
                        {season.champion.username}
                      </span>
                      <span className="font-mono text-[11px] text-amber-300">
                        {season.champion.tag}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {season.champion.country} • {season.champion.favoriteAgent} Main • {season.champion.winRate}% WR
                    </div>
                    <div className="mt-1 font-mono text-xs font-black text-amber-400">
                      Final Score: {formatScore(season.champion.finalScore)} LP
                    </div>
                  </div>
                </div>

                {/* 2nd & 3rd Place Runners up */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Medal className="h-3.5 w-3.5 text-slate-300" />
                      <span className="font-bold text-slate-200">
                        {season.runnerUp.username}
                      </span>
                    </div>
                    <span className="font-mono text-slate-400">
                      {formatScore(season.runnerUp.finalScore)} LP
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-amber-600" />
                      <span className="font-bold text-slate-300">
                        {season.thirdPlace.username}
                      </span>
                    </div>
                    <span className="font-mono text-slate-400">
                      {formatScore(season.thirdPlace.finalScore)} LP
                    </span>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Archives
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};
