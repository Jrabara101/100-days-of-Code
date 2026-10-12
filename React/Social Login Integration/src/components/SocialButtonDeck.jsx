import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon, GitHubIcon, FacebookIcon } from './BrandIcons';
import { Loader2, Sparkles, ShieldCheck, Info } from 'lucide-react';

export function SocialButtonDeck({ recommendedProvider = 'github', intent = 'login' }) {
  const { initiateOAuth, activeHandshake, setPrivacyScopeProvider } = useAuth();
  const [hoveredProvider, setHoveredProvider] = useState(null);

  const isBusy = !!activeHandshake;

  return (
    <div className="space-y-3 w-full">
      {/* 1. Google Button */}
      <button
        type="button"
        disabled={isBusy}
        onClick={() => initiateOAuth('google', intent)}
        onMouseEnter={() => setHoveredProvider('google')}
        onMouseLeave={() => setHoveredProvider(null)}
        className={`group relative w-full h-11 px-4 rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-between
          border shadow-sm
          ${activeHandshake === 'google' 
            ? 'opacity-80 bg-slate-900 border-blue-500/40 text-slate-300' 
            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 dark:bg-[#131314] dark:hover:bg-[#1c1c1f] dark:text-[#E3E1EC] dark:border-[#383941] hover:border-slate-400 dark:hover:border-slate-500'
          }
          ${isBusy && activeHandshake !== 'google' ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.99]'}
        `}
      >
        <div className="flex items-center gap-3">
          {activeHandshake === 'google' ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          ) : (
            <GoogleIcon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105" />
          )}
          <span className="font-medium tracking-tight">
            {activeHandshake === 'google' ? 'Connecting Google...' : 'Continue with Google'}
          </span>
        </div>

        {recommendedProvider === 'google' && (
          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Fastest
          </span>
        )}
      </button>

      {/* 2. GitHub Button */}
      <button
        type="button"
        disabled={isBusy}
        onClick={() => initiateOAuth('github', intent)}
        onMouseEnter={() => setHoveredProvider('github')}
        onMouseLeave={() => setHoveredProvider(null)}
        className={`group relative w-full h-11 px-4 rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-between
          border shadow-sm
          ${activeHandshake === 'github'
            ? 'opacity-80 bg-slate-900 border-slate-600 text-slate-300'
            : 'bg-[#24292F] hover:bg-[#1c2024] text-white border-transparent dark:bg-[#1c1f26] dark:hover:bg-[#252a33] dark:border-[#2f3542]'
          }
          ${isBusy && activeHandshake !== 'github' ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.99]'}
        `}
      >
        <div className="flex items-center gap-3">
          {activeHandshake === 'github' ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          ) : (
            <GitHubIcon className="w-5 h-5 flex-shrink-0 text-white transition-transform group-hover:scale-105" />
          )}
          <span className="font-medium tracking-tight">
            {activeHandshake === 'github' ? 'Connecting GitHub...' : 'Continue with GitHub'}
          </span>
        </div>

        {recommendedProvider === 'github' && (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Dev favorite</span>
          </span>
        )}
      </button>

      {/* 3. Facebook Button */}
      <button
        type="button"
        disabled={isBusy}
        onClick={() => initiateOAuth('facebook', intent)}
        onMouseEnter={() => setHoveredProvider('facebook')}
        onMouseLeave={() => setHoveredProvider(null)}
        className={`group relative w-full h-11 px-4 rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-between
          border shadow-sm
          ${activeHandshake === 'facebook'
            ? 'opacity-80 bg-blue-950/60 border-blue-500/40 text-blue-200'
            : 'bg-[#1877F2] hover:bg-[#166fe5] text-white border-transparent dark:bg-[#1877F2]/90 dark:hover:bg-[#1877F2] dark:border-blue-500/30'
          }
          ${isBusy && activeHandshake !== 'facebook' ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.99]'}
        `}
      >
        <div className="flex items-center gap-3">
          {activeHandshake === 'facebook' ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <FacebookIcon className="w-5 h-5 flex-shrink-0 text-white transition-transform group-hover:scale-105" />
          )}
          <span className="font-medium tracking-tight">
            {activeHandshake === 'facebook' ? 'Connecting Facebook...' : 'Continue with Facebook'}
          </span>
        </div>

        {recommendedProvider === 'facebook' && (
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
            Consumer
          </span>
        )}
      </button>

      {/* Scope Transparency Micro-Trigger */}
      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero passwords stored</span>
        </span>
        <button
          type="button"
          onClick={() => setPrivacyScopeProvider('general')}
          className="hover:text-blue-400 underline underline-offset-2 flex items-center gap-1 transition"
        >
          <Info className="w-3 h-3" />
          <span>Privacy & Scopes</span>
        </button>
      </div>
    </div>
  );
}
