import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PersonaSwitcherBanner } from './components/common/PersonaSwitcherBanner';
import { MockInboxDrawer } from './components/common/MockInboxDrawer';
import { SudoModal } from './components/common/SudoModal';
import { AuthLayout } from './components/auth/AuthLayout';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { PasswordResetTunnel } from './components/auth/PasswordResetTunnel';
import { DashboardLayout } from './components/dashboard/DashboardLayout';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Dark mode state: default to dark (Vault Dark)
  const [darkMode, setDarkMode] = useState(true);

  // Mock Inbox drawer state
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Active unauthenticated view: 'login' | 'register' | 'forgot-password' | 'reset-password'
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');

  // Query/hash parameters for reset or invite tokens
  const [resetParams, setResetParams] = useState<{ token: string; email: string }>({ token: '', email: '' });
  const [inviteParams, setInviteParams] = useState<{ token: string; email: string; role: string }>({
    token: '',
    email: '',
    role: 'Member'
  });

  // Dark mode class sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle Hash Routing
  const parseHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const [path, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString || '');

    if (path === 'register') {
      const inviteToken = params.get('inviteToken') || '';
      const email = params.get('email') || '';
      const role = params.get('role') || 'Member';
      setInviteParams({ token: inviteToken, email, role });
      setAuthView('register');
    } else if (path === 'forgot-password') {
      setAuthView('forgot-password');
    } else if (path === 'reset-password') {
      const token = params.get('token') || '';
      const email = params.get('email') || '';
      setResetParams({ token, email });
      setAuthView('reset-password');
    } else if (path === 'login') {
      setAuthView('login');
    }
  };

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleNavigateToReset = (token: string, email: string) => {
    setResetParams({ token, email });
    setAuthView('reset-password');
    window.location.hash = `/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  };

  const handleNavigateToRegister = (token: string, email: string, role: string) => {
    setInviteParams({ token, email, role });
    setAuthView('register');
    window.location.hash = `/register?inviteToken=${token}&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-vault-bg text-slate-900 dark:text-vault-text transition-colors">
      {/* Top Floating Persona Switcher & Tooling Banner */}
      <PersonaSwitcherBanner
        onOpenInbox={() => setIsInboxOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Workspace Stage */}
      {isAuthenticated ? (
        <DashboardLayout />
      ) : (
        <div className="flex-1 flex flex-col">
          {authView === 'login' && (
            <AuthLayout
              title="Welcome back"
              subtitle="Sign in to your Aegis enterprise workspace"
              badgeText="Zero-Trust Architecture"
            >
              <LoginForm
                onNavigateToForgotPassword={() => {
                  setAuthView('forgot-password');
                  window.location.hash = '/forgot-password';
                }}
                onNavigateToRegister={() => {
                  setAuthView('register');
                  window.location.hash = '/register';
                }}
              />
            </AuthLayout>
          )}

          {authView === 'register' && (
            <AuthLayout
              title={inviteParams.token ? 'Accept Team Invitation' : 'Create workspace account'}
              subtitle="Provision your sovereign cryptographic identity"
              badgeText="Principle of Least Privilege"
            >
              <RegisterForm
                onNavigateToLogin={() => {
                  setAuthView('login');
                  window.location.hash = '/login';
                }}
                inviteToken={inviteParams.token}
                initialEmail={inviteParams.email}
                initialRole={inviteParams.role}
              />
            </AuthLayout>
          )}

          {(authView === 'forgot-password' || authView === 'reset-password') && (
            <AuthLayout
              title="Account Recovery Tunnel"
              subtitle="Zero-anxiety self-service credential rotation"
              badgeText="Enumeration-Safe Protection"
            >
              <PasswordResetTunnel
                onNavigateToLogin={() => {
                  setAuthView('login');
                  window.location.hash = '/login';
                }}
                onOpenMockInbox={() => setIsInboxOpen(true)}
                initialToken={resetParams.token}
                initialEmail={resetParams.email}
              />
            </AuthLayout>
          )}
        </div>
      )}

      {/* Global Sudo Modal */}
      <SudoModal />

      {/* Simulated Mailbox Drawer */}
      <MockInboxDrawer
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onNavigateToReset={handleNavigateToReset}
        onNavigateToRegister={handleNavigateToRegister}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
