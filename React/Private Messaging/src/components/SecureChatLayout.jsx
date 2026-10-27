import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldCheck, Flame, Plus, Zap, Lock, Volume2, VolumeX, 
  Search, Eye, EyeOff, Info, AlertTriangle, CheckCheck, RefreshCw, Key
} from 'lucide-react';
import { generateIdenticon } from '../crypto/cryptoEngine';
import { sounds } from '../sound/soundEffects';
import MessageStream from './MessageStream';
import ProtectedComposer from './ProtectedComposer';
import ThreadSecurityDrawer from './ThreadSecurityDrawer';
import SafetyVerificationModal from './SafetyVerificationModal';
import NewChatModal from './NewChatModal';

export default function SecureChatLayout({ 
  vault, 
  onPanicTrigger,
  onLockApp 
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'disappearing' | 'verified'
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.isMuted());
  const [activeContactForModal, setActiveContactForModal] = useState(null);

  const { user, contacts, messages, activeThreadId, shieldActive } = vault;
  const activeContact = contacts.find(c => c.id === activeThreadId) || contacts[0];

  // Inactivity & Window Blur Anti-Surveillance Sentinel
  useEffect(() => {
    let inactivityTimer;

    const resetInactivity = () => {
      clearTimeout(inactivityTimer);
      // Auto lock after 2 minutes
      inactivityTimer = setTimeout(() => {
        onLockApp();
      }, 120000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Obscure tab contents immediately when tab switched
        vault.shieldActive = true;
        vault.notify();
      }
    };

    window.addEventListener('mousemove', resetInactivity);
    window.addEventListener('keydown', resetInactivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetInactivity();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetInactivity);
      window.removeEventListener('keydown', resetInactivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playTapSound();
  };

  const handleSelectThread = (id) => {
    vault.activeThreadId = id;
    const c = vault.contacts.find(ct => ct.id === id);
    if (c) c.unreadCount = 0;
    sounds.playTapSound();
    vault.persist();
    vault.notify();
  };

  // Filtered contacts
  const filteredContacts = contacts.filter(c => {
    if (filter === 'disappearing' && (!c.defaultTtl || c.defaultTtl <= 0)) return false;
    if (filter === 'verified' && !c.isVerified) return false;
    if (searchQuery.trim()) {
      return c.alias.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const activeMessages = messages.filter(m => m.threadId === activeContact?.id);

  const formatTtlBadge = (ttl) => {
    if (!ttl || ttl <= 0) return 'Off';
    if (ttl === 5) return '5s';
    if (ttl === 60) return '1m';
    if (ttl === 3600) return '1h';
    if (ttl === 86400) return '24h';
    return `${ttl}s`;
  };

  const userIdenticonUrl = user?.publicKeyB64 ? generateIdenticon(user.publicKeyB64, 44) : '';
  const contactIdenticonUrl = activeContact?.publicKeyB64 ? generateIdenticon(activeContact.publicKeyB64, 44) : '';

  return (
    <div className="flex h-screen w-screen bg-[#07080A] text-[#F3F4F6] font-sans overflow-hidden select-none copy-lockdown">
      {/* LEFT RAIL (Secure Threads - 320px wide) */}
      <div className="w-80 sm:w-84 border-r border-[#1D222D] bg-[#0E1015] flex flex-col shrink-0">
        {/* Top Shield Header */}
        <div className="p-4 border-b border-[#1D222D] bg-[#14171E]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={userIdenticonUrl} 
                alt="My Identicon" 
                className="w-10 h-10 rounded-xl border border-[#1D222D]" 
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0E1015]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white truncate max-w-[110px]">{user?.alias}</span>
                <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  E2EE
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Blind Relay Armed</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* New Encrypted Chat Button */}
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Add Contact / Ephemeral Invite"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Lock App */}
            <button
              onClick={onLockApp}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Lock Sanctuary"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Global Panic Wipe Trigger */}
            <button
              onClick={onPanicTrigger}
              className="p-2 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors glow-hazard"
              title="Instant Panic Wipe (Cmd+Shift+X)"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#1D222D]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search local aliases..."
              className="w-full bg-[#07080A] border border-[#1D222D] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40 font-mono"
            />
          </div>
        </div>

        {/* Ephemeral Filter Pills */}
        <div className="p-2 border-b border-[#1D222D] flex gap-1 bg-[#0E1015]">
          {[
            { id: 'all', label: `All (${contacts.length})` },
            { id: 'disappearing', label: `Disappearing (${contacts.filter(c => c.defaultTtl > 0).length})` },
            { id: 'verified', label: `Verified (${contacts.filter(c => c.isVerified).length})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => { setFilter(pill.id); sounds.playTapSound(); }}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-mono transition-colors text-center truncate ${
                filter === pill.id
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Thread Roster Cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1D222D]/60">
          {filteredContacts.map((c) => {
            const isSelected = activeContact?.id === c.id;
            const identicon = generateIdenticon(c.publicKeyB64, 40);

            return (
              <div
                key={c.id}
                onClick={() => handleSelectThread(c.id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors relative ${
                  isSelected 
                    ? 'bg-[#14171E] border-l-2 border-emerald-500' 
                    : 'hover:bg-[#14171E]/40'
                }`}
              >
                {/* Avatar with lock badge */}
                <div className="relative shrink-0">
                  <img src={identicon} alt={c.alias} className="w-10 h-10 rounded-xl border border-[#1D222D]" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0E1015] border border-[#1D222D] flex items-center justify-center">
                    {c.isVerified ? (
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    ) : c.keyChanged ? (
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                    ) : (
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Left Stack: Alias & Blurred snippet */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-medium text-slate-200 truncate pr-1">
                      {c.alias}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">14:02</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-[130px] opacity-75">
                      [Encrypted Payload]
                    </p>

                    <div className="flex items-center gap-1.5">
                      {/* Self-destruct indicator badge */}
                      {c.defaultTtl > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] font-mono text-red-400 bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20">
                          <Flame className="w-2.5 h-2.5" />
                          {formatTtlBadge(c.defaultTtl)}
                        </span>
                      )}

                      {/* Verified Key Checkmark */}
                      {c.isVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Multi-tab & Blind Relay Notice */}
        <div className="p-3 border-t border-[#1D222D] bg-[#07080A]/60 text-[10px] font-mono text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Relay Active
          </span>
          <span>Zero Server Logs</span>
        </div>
      </div>

      {/* CENTER STAGE (The Active Encrypted Feed) */}
      <div className="flex-1 flex flex-col bg-[#07080A] relative overflow-hidden">
        {/* Top Security Ribbon */}
        <div className="h-16 px-4 md:px-6 border-b border-[#1D222D] bg-[#0E1015]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
          {/* Left: Contact identicon, contact alias, and verification pill */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={contactIdenticonUrl} 
                alt={activeContact?.alias} 
                className="w-9 h-9 rounded-xl border border-[#1D222D]" 
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border border-[#0E1015]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">{activeContact?.alias}</h2>
                {activeContact?.isVerified ? (
                  <button
                    onClick={() => { setActiveContactForModal(activeContact); setIsVerifyModalOpen(true); }}
                    className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>[✓ Safety Number Verified]</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { setActiveContactForModal(activeContact); setIsVerifyModalOpen(true); }}
                    className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>[⚠️ Unverified Key]</span>
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                ECDH P-256 / AES-256-GCM Blind Relay
              </span>
            </div>
          </div>

          {/* Center / Right: Ephemeral Horizon Selector, Tap-to-Shield, Details */}
          <div className="flex items-center gap-2">
            {/* Active self-destruct horizon selector pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14171E] border border-[#1D222D] text-xs font-mono text-slate-300">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Disappearing: {formatTtlBadge(activeContact?.defaultTtl)}</span>
            </div>

            {/* Tap-to-Shield Toggle */}
            <button
              onClick={() => vault.toggleShield()}
              className={`p-2 rounded-xl transition-all ${
                shieldActive 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-emerald' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              title="Tap-to-Shield (Anti-Shoulder Surfing Blur)"
            >
              {shieldActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Thread Security Details toggle */}
            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Thread Security Details"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Key Mismatch Alarm Banner */}
        {activeContact?.keyChanged && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300 animate-key-alert z-20">
            <div className="flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>{activeContact.alias}'s security keys have changed.</strong> Verify new identity before sending.
              </span>
            </div>
            <button
              onClick={() => { setActiveContactForModal(activeContact); setIsVerifyModalOpen(true); }}
              className="px-3 py-1 bg-amber-500 text-black font-semibold rounded-lg text-xs hover:bg-amber-400 transition-colors"
            >
              Verify Safety Numbers
            </button>
          </div>
        )}

        {/* Message Stream */}
        <MessageStream
          messages={activeMessages}
          activeContact={activeContact}
          onShredMessage={(msgId) => vault.shredMessage(msgId)}
          shieldActive={shieldActive}
        />

        {/* Bottom Protected Composer */}
        <ProtectedComposer
          activeContact={activeContact}
          onSendMessage={(payload) => vault.sendMessage(payload)}
          onVerifyPrompt={() => { setActiveContactForModal(activeContact); setIsVerifyModalOpen(true); }}
        />
      </div>

      {/* Right Drawer: Cryptographic Inspector */}
      <ThreadSecurityDrawer
        contact={activeContact}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onUpdateAlias={(id, alias) => vault.updateContactAlias(id, alias)}
        onSetTtl={(id, ttl) => vault.setThreadTtl(id, ttl)}
        onVerifyModalOpen={(contact) => { setActiveContactForModal(contact); setIsVerifyModalOpen(true); }}
        onSimulateKeyChange={(id) => vault.simulateKeyChange(id)}
        onBurnThread={(id) => vault.burnThread(id)}
      />

      {/* Safety Verification Modal */}
      {isVerifyModalOpen && activeContactForModal && (
        <SafetyVerificationModal
          contact={activeContactForModal}
          user={user}
          onClose={() => setIsVerifyModalOpen(false)}
          onVerifyToggle={(id, verified) => vault.setContactVerified(id, verified)}
        />
      )}

      {/* New Encrypted Chat Modal */}
      {isNewChatOpen && (
        <NewChatModal
          user={user}
          onClose={() => setIsNewChatOpen(false)}
          onAddContact={(data) => vault.addContact(data)}
        />
      )}
    </div>
  );
}
