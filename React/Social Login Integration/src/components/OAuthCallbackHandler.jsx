import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GoogleIcon, GitHubIcon, FacebookIcon } from './BrandIcons';
import { Loader2, AlertCircle, ArrowLeft, ShieldAlert, CheckCircle2, RotateCw } from 'lucide-react';

export function OAuthCallbackHandler({ onNavigate }) {
  const { setUser, setIdentities, setConflictData, setIsConflictModalOpen, addToast } = useAuth();
  
  const [stage, setStage] = useState(0); // 0: connecting, 1: state validation, 2: reconciliation, 3: workspace ready
  const [errorState, setErrorState] = useState(null); // { type, title, message }
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  const executionRef = useRef(false);

  // Parse URL search parameters
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const provider = urlParams.get('provider') || 'social';
  const errorParam = urlParams.get('error');

  const getProviderIcon = () => {
    switch (provider) {
      case 'google': return <GoogleIcon className="w-8 h-8" />;
      case 'github': return <GitHubIcon className="w-8 h-8 text-white" />;
      case 'facebook': return <FacebookIcon className="w-8 h-8 text-white" />;
      default: return <Loader2 className="w-8 h-8 animate-spin text-blue-400" />;
    }
  };

  const getProviderRingColor = () => {
    switch (provider) {
      case 'google': return 'border-blue-500/30 ring-blue-500/20';
      case 'github': return 'border-slate-500/30 ring-slate-400/20';
      case 'facebook': return 'border-blue-600/40 ring-blue-600/30';
      default: return 'border-indigo-500/30 ring-indigo-500/20';
    }
  };

  // Staged progress labels
  const STAGES = [
    `Authenticating with ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`,
    'Validating cryptographic state & PKCE challenge...',
    'Reconciling verified email and identities...',
    'Securing your workspace session...'
  ];

  useEffect(() => {
    // 8-second slow connection safety fallback
    const slowTimer = setTimeout(() => {
      setShowSlowWarning(true);
    }, 8000);

    return () => clearTimeout(slowTimer);
  }, []);

  useEffect(() => {
    if (executionRef.current) return;
    executionRef.current = true;

    // Check if provider returned an OAuth error code
    if (errorParam) {
      if (errorParam === 'access_denied') {
        setErrorState({
          type: 'cancelled',
          title: 'Authorization Cancelled',
          message: `You declined the authorization prompt on ${provider.charAt(0).toUpperCase() + provider.slice(1)}. No permissions were granted and no account was modified.`
        });
      } else if (errorParam === 'unverified_email') {
        setErrorState({
          type: 'unverified',
          title: 'Unverified Email Address',
          message: `Your ${provider} account primary email address is unverified. For security, AuthMesh requires a confirmed email identity before granting access.`
        });
      } else {
        setErrorState({
          type: 'generic',
          title: 'OAuth Handshake Interrupted',
          message: `The identity provider returned error: "${errorParam}". Please try again.`
        });
      }
      return;
    }

    if (!code || !state) {
      setErrorState({
        type: 'missing_params',
        title: 'Missing Authorization Parameters',
        message: 'No authorization code or cryptographic state parameter was returned in the callback URL.'
      });
      return;
    }

    // Retrieve PKCE code_verifier from sessionStorage
    const codeVerifier = sessionStorage.getItem(`pkce_verifier_${state}`) || '';

    async function handleExchange() {
      try {
        setStage(1);
        await new Promise(r => setTimeout(r, 600));

        setStage(2);
        const result = await api.exchangeCallback({
          code,
          state,
          code_verifier: codeVerifier,
          provider
        });

        // Clean up sessionStorage
        sessionStorage.removeItem(`pkce_verifier_${state}`);
        sessionStorage.removeItem(`oauth_provider_${state}`);

        if (result.status === 'collision') {
          // Account Collision detected!
          setConflictData(result.conflict);
          setIsConflictModalOpen(true);
          // Redirect to login where modal is mounted
          onNavigate('/login');
          return;
        }

        setStage(3);
        await new Promise(r => setTimeout(r, 500));

        if (result.user) {
          setUser(result.user);
          setIdentities(result.identities || []);
          addToast({
            type: 'success',
            title: result.action === 'registered' ? 'Account Created!' : 'Authenticated!',
            message: `Welcome to AuthMesh, ${result.user.full_name || result.user.email}!`
          });
          onNavigate('/dashboard');
        } else if (result.status === 'linked') {
          setUser(result.user);
          setIdentities(result.identities || []);
          addToast({
            type: 'success',
            title: 'Provider Connected!',
            message: `Successfully linked ${provider} to your account.`
          });
          onNavigate('/dashboard');
        }
      } catch (err) {
        setErrorState({
          type: 'exchange_failure',
          title: 'Handshake Verification Failed',
          message: err.message || 'Unable to exchange authorization code for identity tokens.'
        });
      }
    }

    handleExchange();
  }, [code, state, provider, errorParam, onNavigate, setUser, setIdentities, setConflictData, setIsConflictModalOpen, addToast]);

  // Error Fallback View
  if (errorState) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl border border-rose-500/30 bg-[#121316] text-[#F8FAFC] shadow-2xl glass-panel space-y-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">{errorState.title}</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{errorState.message}</p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => onNavigate('/login')}
              className="w-full h-11 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Sign In</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full h-9 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Callback Handshake</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Interstitial View
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-8 animate-in fade-in duration-300">
        
        {/* Pulsing Ring Framing Active Provider Icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          {/* Animated pulsing outer halo */}
          <div className={`absolute inset-0 rounded-full border-2 animate-ring-pulse ${getProviderRingColor()}`} />
          <div className="absolute inset-2 rounded-full bg-blue-500/10 blur-md animate-pulse" />

          {/* Provider badge center */}
          <div className="relative w-16 h-16 rounded-2xl bg-[#121316] border border-white/10 shadow-2xl flex items-center justify-center">
            {getProviderIcon()}
          </div>
        </div>

        {/* Dynamic Context Status Indicator */}
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-white tracking-tight">
            {STAGES[stage] || 'Securing your workspace...'}
          </h2>
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === stage
                    ? 'w-6 bg-blue-500 shadow-sm shadow-blue-500/50'
                    : step < stage
                    ? 'w-3 bg-emerald-500'
                    : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-1">
            RFC 7636 PKCE · 256-bit TLS handshake
          </p>
        </div>

        {/* 8-second slow connection safety link */}
        {showSlowWarning && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 animate-in fade-in duration-200">
            Taking longer than usual?{' '}
            <button
              onClick={() => onNavigate('/login')}
              className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
            >
              Click here to return to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
