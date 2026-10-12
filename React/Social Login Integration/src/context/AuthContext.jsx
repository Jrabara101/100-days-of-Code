import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, generatePKCEPair } from '../services/api';
import confetti from 'canvas-confetti';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [identities, setIdentities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeHandshake, setActiveHandshake] = useState(null); // 'google' | 'github' | 'facebook' | null

  // Conflict / Collision modal state
  const [conflictData, setConflictData] = useState(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // Simulation consent dialog state
  const [simulationState, setSimulationState] = useState(null); // { isOpen, provider, state, codeChallenge, personas, intent }

  // Privacy scope modal state
  const [privacyScopeProvider, setPrivacyScopeProvider] = useState(null);

  // Security audit log drawer state
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4500 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch current session
  const refreshSession = useCallback(async () => {
    try {
      const data = await api.getMe();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setIdentities(data.identities || []);
      } else {
        setUser(null);
        setIdentities([]);
      }
    } catch (err) {
      console.warn('Session refresh failed:', err.message);
      setUser(null);
      setIdentities([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  /**
   * Triggers one-click native social handshake
   */
  const initiateOAuth = useCallback(async (provider, intent = 'login') => {
    setActiveHandshake(provider);
    try {
      // 1. Generate client-side PKCE parameters
      const { codeVerifier, codeChallenge } = await generatePKCEPair();

      // 2. Request authorization metadata from server
      const authData = await api.authorizeOAuth({
        provider,
        intent,
        code_challenge: codeChallenge
      });

      // 3. Store verifier in sessionStorage mapped to state
      sessionStorage.setItem(`pkce_verifier_${authData.state}`, codeVerifier);
      sessionStorage.setItem(`oauth_provider_${authData.state}`, provider);

      if (authData.mode === 'redirect') {
        // Real external OAuth redirect
        window.location.href = authData.authorizationUrl;
      } else {
        // Open the high-fidelity interactive simulation suite
        setSimulationState({
          isOpen: true,
          provider,
          state: authData.state,
          codeChallenge: authData.codeChallenge,
          personas: authData.personas || [],
          providerConfig: authData.providerConfig,
          intent: authData.intent
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Authentication Error',
        message: err.message || 'Unable to initialize OAuth handshake.'
      });
      setActiveHandshake(null);
    }
  }, [addToast]);

  /**
   * Finalizes simulation choice from consent screen
   */
  const completeSimulatedConsent = useCallback(async ({ profile, simulateError }) => {
    if (!simulationState) return;
    try {
      const result = await api.submitSimulatedConsent({
        provider: simulationState.provider,
        state: simulationState.state,
        codeChallenge: simulationState.codeChallenge,
        profile,
        simulateError
      });

      setSimulationState(null);

      // Navigate to callback route inside React router or window location
      if (result.redirectUrl) {
        window.history.pushState({}, '', result.redirectUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Simulation Failed',
        message: err.message
      });
    } finally {
      setActiveHandshake(null);
    }
  }, [simulationState, addToast]);

  /**
   * Guided Step-Up Merge Verification
   */
  const executeStepUpMerge = useCallback(async (mergeTicket) => {
    try {
      const result = await api.stepUpMerge({
        mergeTicket,
        stepUpVerified: true
      });

      setUser(result.user);
      setIdentities(result.identities);
      setIsConflictModalOpen(false);
      setConflictData(null);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      addToast({
        type: 'success',
        title: 'Accounts Successfully Linked!',
        message: 'Your identities have been merged into your unified account.'
      });

      // Route to dashboard
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Merge Failed',
        message: err.message || 'Could not complete identity merge.'
      });
    }
  }, [addToast]);

  /**
   * Disconnect a linked provider with guardrail checks
   */
  const unlinkProvider = useCallback(async (provider) => {
    try {
      const result = await api.unlinkProvider({ provider });
      setIdentities(result.identities);
      addToast({
        type: 'info',
        title: 'Provider Disconnected',
        message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account was safely detached.`
      });
    } catch (err) {
      addToast({
        type: 'warning',
        title: 'Guardrail Warning',
        message: err.message || 'Cannot unlink provider.'
      });
    }
  }, [addToast]);

  /**
   * Email sign-in fallback
   */
  const emailLogin = useCallback(async (email, fullName) => {
    try {
      const data = await api.emailLogin({ email, full_name: fullName });
      setUser(data.user);
      setIdentities(data.identities);
      addToast({
        type: 'success',
        title: 'Welcome Back!',
        message: `Signed in as ${data.user.email}`
      });
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Sign In Failed',
        message: err.message
      });
    }
  }, [addToast]);

  /**
   * Terminate active session
   */
  const logout = useCallback(async () => {
    try {
      await api.logout();
      setUser(null);
      setIdentities([]);
      addToast({
        type: 'info',
        title: 'Signed Out',
        message: 'Your session has been securely ended.'
      });
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [addToast]);

  /**
   * Resets demo database to clean initial state
   */
  const resetDemo = useCallback(async () => {
    try {
      await api.resetDemo();
      setUser(null);
      setIdentities([]);
      addToast({
        type: 'info',
        title: 'Demo Environment Reset',
        message: 'Default user alex.chen@acme.corp (Google) restored.'
      });
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Reset Error',
        message: err.message
      });
    }
  }, [addToast]);

  const value = {
    user,
    setUser,
    identities,
    setIdentities,
    isAuthenticated: !!user,
    isLoading,
    activeHandshake,
    setActiveHandshake,
    initiateOAuth,
    simulationState,
    setSimulationState,
    completeSimulatedConsent,
    conflictData,
    setConflictData,
    isConflictModalOpen,
    setIsConflictModalOpen,
    executeStepUpMerge,
    unlinkProvider,
    emailLogin,
    logout,
    resetDemo,
    toasts,
    addToast,
    removeToast,
    privacyScopeProvider,
    setPrivacyScopeProvider,
    isAuditDrawerOpen,
    setIsAuditDrawerOpen,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a SocialAuthProvider');
  }
  return context;
}
