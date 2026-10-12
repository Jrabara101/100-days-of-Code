import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon, GitHubIcon, FacebookIcon } from './BrandIcons';
import { X, Shield, Check, AlertOctagon, User, Sparkles, Key, AlertTriangle } from 'lucide-react';

export function OAuthSimulatorModal() {
  const { simulationState, setSimulationState, completeSimulatedConsent } = useAuth();
  
  const [selectedPersonaId, setSelectedPersonaId] = useState(
    simulationState?.personas?.[0]?.id || 'custom'
  );

  const [customProfile, setCustomProfile] = useState({
    name: 'Custom Developer',
    email: 'dev.user@example.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    email_verified: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!simulationState || !simulationState.isOpen) return null;

  const { provider, personas = [], providerConfig, intent } = simulationState;

  const getProviderIcon = () => {
    switch (provider) {
      case 'google': return <GoogleIcon className="w-6 h-6" />;
      case 'github': return <GitHubIcon className="w-6 h-6 text-white" />;
      case 'facebook': return <FacebookIcon className="w-6 h-6 text-white" />;
      default: return <Shield className="w-6 h-6 text-blue-400" />;
    }
  };

  const activePersona = personas.find(p => p.id === selectedPersonaId);
  const activeProfile = activePersona ? activePersona.profile : customProfile;

  const handleAuthorize = async () => {
    setIsSubmitting(true);
    await completeSimulatedConsent({
      profile: activeProfile,
      simulateError: null
    });
    setIsSubmitting(false);
  };

  const handleSimulateError = async (errorCode) => {
    setIsSubmitting(true);
    await completeSimulatedConsent({
      profile: null,
      simulateError: errorCode
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121316] text-[#F8FAFC] shadow-2xl glass-panel overflow-hidden specular-border">
        
        {/* Top simulation test bench ribbon */}
        <div className="bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 px-5 py-2.5 border-b border-white/10 flex items-center justify-between text-xs font-mono">
          <span className="flex items-center gap-1.5 text-blue-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive {provider.toUpperCase()} Consent Suite</span>
          </span>
          <span className="text-slate-400 text-[11px]">Developer Sandbox Mode</span>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setSimulationState(null)}
          className="absolute top-12 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
              {getProviderIcon()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {intent === 'link' ? `Connect your ${providerConfig?.name || provider} Account` : `Sign in with ${providerConfig?.name || provider}`}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                AuthMesh is requesting verified identity access to your public profile.
              </p>
            </div>
          </div>

          {/* Test Persona Selection Deck */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Select Test Persona</span>
              <span className="text-blue-400">Try collision or clean sign-in</span>
            </label>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3
                    ${selectedPersonaId === persona.id 
                      ? 'bg-blue-600/15 border-blue-500/50 shadow-sm' 
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={persona.profile.avatar}
                      alt={persona.profile.name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-2">
                        <span>{persona.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate font-mono">
                        {persona.profile.email}
                      </div>
                    </div>
                  </div>

                  {selectedPersonaId === persona.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}

              {/* Custom Persona Option */}
              <div
                onClick={() => setSelectedPersonaId('custom')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3
                  ${selectedPersonaId === 'custom' 
                    ? 'bg-blue-600/15 border-blue-500/50 shadow-sm' 
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Custom Profile Input</div>
                    <div className="text-[11px] text-slate-400">Specify custom name and email</div>
                  </div>
                </div>
                {selectedPersonaId === 'custom' && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            </div>

            {/* Custom input fields if custom is selected */}
            {selectedPersonaId === 'custom' && (
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5 animate-in fade-in duration-150">
                <div>
                  <label className="text-[10px] font-mono text-slate-400">Display Name</label>
                  <input
                    type="text"
                    value={customProfile.name}
                    onChange={(e) => setCustomProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400">Verified Email</label>
                  <input
                    type="email"
                    value={customProfile.email}
                    onChange={(e) => setCustomProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Scope Disclosures */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5 text-xs">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Permissions Requested</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {providerConfig?.scopeDescription || 'Reads public profile and confirmed primary email.'}
            </p>
          </div>

          {/* Action Deck */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAuthorize}
              className="w-full h-11 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <span>Authorize & Continue to AuthMesh</span>
            </button>

            {/* Error simulation buttons for thorough resilience testing */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSimulateError('access_denied')}
                className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/5 transition flex items-center justify-center gap-1"
              >
                <AlertOctagon className="w-3 h-3" />
                <span>Simulate Cancel</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSimulateError('unverified_email')}
                className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-white/5 transition flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Simulate Unverified Email</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
