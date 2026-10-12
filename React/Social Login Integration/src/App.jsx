import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OAuthCallbackHandler } from './components/OAuthCallbackHandler';
import { AccountConflictModal } from './components/AccountConflictModal';
import { OAuthSimulatorModal } from './components/OAuthSimulatorModal';
import { PrivacyScopeModal } from './components/PrivacyScopeModal';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { ToastContainer } from './components/ToastContainer';
import { Shield, Lock, CheckCircle2, GitBranch, Terminal } from 'lucide-react';

const queryClient = new QueryClient();

function MainContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Sync routing on popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090A0C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center animate-pulse">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-xs font-mono text-slate-400">Initializing AuthMesh Gateway...</p>
        </div>
      </div>
    );
  }

  // Route matching
  const isCallbackRoute = currentPath.startsWith('/auth/callback');

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C] text-[#F8FAFC]">
      {/* Global Navigation Header (hidden on callback interstitial) */}
      {!isCallbackRoute && (
        <Navbar currentPath={currentPath} onNavigate={navigate} />
      )}

      {/* Main Viewport */}
      <main className="flex-1">
        {isCallbackRoute ? (
          <OAuthCallbackHandler onNavigate={navigate} />
        ) : isAuthenticated && currentPath !== '/login' ? (
          <DashboardPage onNavigate={navigate} />
        ) : (
          <LoginPage onNavigate={navigate} />
        )}
      </main>

      {/* Footer */}
      {!isCallbackRoute && (
        <footer className="border-t border-white/[0.06] bg-[#090A0C]/60 py-6 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-slate-400">All identity systems operational</span>
              <span>•</span>
              <span>256-bit AES encryption</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="hover:text-slate-300 transition">Google PKCE</span>
              <span className="hover:text-slate-300 transition">GitHub OAuth 2.0</span>
              <span className="hover:text-slate-300 transition">Meta Graph v19</span>
              <span className="hover:text-slate-300 transition">SOC2 Type II</span>
            </div>
          </div>
        </footer>
      )}

      {/* Global Modals & Overlay Drawers */}
      <AccountConflictModal />
      <OAuthSimulatorModal />
      <PrivacyScopeModal />
      <AuditLogDrawer />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
