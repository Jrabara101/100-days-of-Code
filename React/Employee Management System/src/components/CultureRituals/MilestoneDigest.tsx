import React from 'react';
import { 
  Award, 
  Cake, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Calendar, 
  Heart, 
  Send,
  Building2,
  Clock
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { Employee } from '../../types';
import confetti from 'canvas-confetti';

interface MilestoneDigestProps {
  onSelectEmployee: (emp: Employee) => void;
}

export const MilestoneDigest: React.FC<MilestoneDigestProps> = ({
  onSelectEmployee
}) => {
  const allEmployees = storage.getEmployees();
  const allDepts = storage.getDepartments();

  const handleCelebrate = (name: string) => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
    alert(`🎉 Celebrated ${name} with company-wide tenure kudos!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
            Workplace Culture Rituals & Tenure Pulse
          </h1>
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold">
            Tenure Milestones
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Automated celebrations for upcoming work anniversaries, onboarding welcomes, and workforce velocity.
        </p>
      </div>

      {/* Top 3 Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Quarterly Velocity</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">+6 Net</span>
            <span className="text-xs text-emerald-500 font-semibold font-mono">97.4% Retention</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            2 new offers in candidate pipeline this month
          </p>
        </div>

        <div className="p-4.5 rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Team Tenure</span>
            <Award className="w-4 h-4 text-brand" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">2.8 Years</span>
            <span className="text-xs text-slate-400 font-mono">Company Median</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            14 founding members &gt;3 years
          </p>
        </div>

        <div className="p-4.5 rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Global Timezone Spread</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">5 Hubs</span>
            <span className="text-xs text-slate-400 font-mono">UTC-7 to UTC+9</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            London, Berlin, New York, Tokyo, Stockholm
          </p>
        </div>
      </div>

      {/* Main Grid: Anniversaries, Welcomes, Birthdays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Work Anniversaries */}
        <div className="rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Upcoming Work Anniversaries (October & November)
              </h3>
              <p className="text-xs text-slate-500">
                Celebrating dedication, architectural breakthroughs, and squad growth.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { empId: 'emp-011', name: 'Kaito Tanaka', title: 'Principal Frontend Architect', tenure: '3 Years', date: 'Nov 15', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80' },
              { empId: 'emp-002', name: 'Marcus Vance', title: 'VP of Platform Engineering', tenure: '5 Years', date: 'Nov 20', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
              { empId: 'emp-007', name: 'Elena Rostova', title: 'Staff Infrastructure Lead', tenure: '4 Years', date: 'Dec 01', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                        {item.tenure}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {item.title} • Milestone on {item.date}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCelebrate(item.name)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kudos</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Welcome New Onboardings */}
        <div className="rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Welcoming New Onboardings
              </h3>
              <p className="text-xs text-slate-500">
                Fresh teammates joining our mission this quarter.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { empId: 'emp-014', name: 'Priya Sharma', title: 'Senior Product Manager', dept: 'Product', joinDate: 'Nov 1, 2026', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80', status: 'Pre-Boarding' },
              { empId: 'emp-015', name: 'Liam O\'Connor', title: 'Database Performance Specialist', dept: 'Engineering', joinDate: 'May 15, 2026', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', status: 'Active Contractor' }
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {item.title} • Joining {item.joinDate}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCelebrate(item.name)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand/10 text-brand hover:bg-brand hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Welcome</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
