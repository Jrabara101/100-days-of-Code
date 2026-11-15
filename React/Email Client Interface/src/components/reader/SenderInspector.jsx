import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  MapPin, 
  Paperclip, 
  Building2, 
  Sparkles,
  X
} from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

export function SenderInspector() {
  const { 
    selectedThreadId, 
    toggleRightRail, 
    setSelectedThreadId
  } = useMailStore();

  const [localTime, setLocalTime] = useState('');
  const [activeTab, setActiveTab] = useState('threads'); // 'threads' | 'files'

  const thread = useLiveQuery(() => db.threads.get(selectedThreadId), [selectedThreadId]);
  const senderEmail = thread?.primary_sender?.email;

  const contact = useLiveQuery(
    () => senderEmail ? db.contacts.where({ email: senderEmail }).first() : null,
    [senderEmail]
  );

  // Compute sender's local time based on contact's timezone
  useEffect(() => {
    const updateSenderTime = () => {
      try {
        const tz = contact?.timezone || 'UTC';
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZoneName: 'short',
        }).format(new Date());
        setLocalTime(formatted);
      } catch {
        setLocalTime('09:45 AM UTC');
      }
    };
    updateSenderTime();
    const interval = setInterval(updateSenderTime, 30000);
    return () => clearInterval(interval);
  }, [contact?.timezone]);

  // Query recent threads and shared files involving this sender
  const allThreads = useLiveQuery(() => db.threads.toArray()) || [];
  const senderThreads = allThreads.filter(t => 
    t.primary_sender?.email === senderEmail || 
    t.participants?.some(p => p.email === senderEmail)
  );

  const sharedFiles = [
    { name: 'Stripe_Enterprise_MSA_v3.pdf', size: '1.4 MB', date: 'Today', type: 'pdf' },
    { name: 'Data_Processing_Addendum_Exhibit_B.docx', size: '380 KB', date: 'Nov 11', type: 'doc' },
    { name: 'SOC2_Type2_Compliance_Attestation.pdf', size: '2.1 MB', date: 'Oct 28', type: 'pdf' },
    { name: 'Q3_API_Volume_Invoice_INV7721.pdf', size: '190 KB', date: 'Oct 02', type: 'pdf' },
  ];

  if (!thread) return null;

  const isVip = contact?.vip || thread?.primary_sender?.is_vip;

  const toggleVip = async () => {
    if (contact) {
      await db.contacts.update(contact.email, { vip: !contact.vip });
    }
  };

  return (
    <aside className="w-[300px] flex-shrink-0 h-full border-l border-[#E2E8F0] dark:border-[#222632] bg-[#F8FAFC] dark:bg-[#101217] flex flex-col justify-between select-none overflow-hidden animate-fade-in">
      {/* Top Header */}
      <div className="h-14 px-4 border-b border-[#E2E8F0] dark:border-[#222632] flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Sender 360° Context
        </span>
        <button
          onClick={toggleRightRail}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Profile Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632] shadow-2xs text-center relative overflow-hidden">
          {/* Subtle gradient banner */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10" />

          <div className="relative pt-2">
            <div className="relative inline-block mx-auto mb-2">
              <img
                src={contact?.avatar || thread?.primary_sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt=""
                className={`w-16 h-16 rounded-full object-cover mx-auto ${
                  isVip ? 'ring-3 ring-amber-400 p-0.5' : 'ring-1 ring-slate-200 dark:ring-slate-700'
                }`}
              />
              {isVip && (
                <span className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-slate-900 rounded-full shadow-sm">
                  <Crown className="w-3 h-3 stroke-[2.5]" />
                </span>
              )}
            </div>

            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
              <span>{contact?.name || thread?.primary_sender?.name}</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {contact?.role || 'Partner Contact'}
            </p>

            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1">
              <Building2 className="w-3 h-3" />
              <span>{contact?.company || 'Enterprise Partner'}</span>
            </div>

            {/* Timezone pill */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
              <MapPin className="w-3 h-3 text-emerald-500" />
              <span>{contact?.city || 'London, UK'} &bull; {localTime}</span>
            </div>

            {/* VIP Toggle Button */}
            <div className="mt-3 pt-3 border-t border-[#E2E8F0] dark:border-[#222632]">
              <button
                onClick={toggleVip}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  isVip
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${isVip ? 'fill-amber-400' : ''}`} />
                <span>{isVip ? 'VIP Contact (Priority)' : 'Mark as VIP Sender'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Relationship Stats Pill */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632]">
            <span className="block text-[11px] text-slate-400">Past Threads</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-sm">
              {senderThreads.length || 14}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632]">
            <span className="block text-[11px] text-slate-400">Shared Files</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-sm">
              {sharedFiles.length}
            </span>
          </div>
        </div>

        {/* Accordion Tabs: Recent Threads vs Shared Files */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632] space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#222632] pb-2 text-xs">
            <button
              onClick={() => setActiveTab('threads')}
              className={`font-semibold pb-0.5 transition ${
                activeTab === 'threads' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Recent Threads ({senderThreads.length})
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`font-semibold pb-0.5 transition ${
                activeTab === 'files' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Shared Files ({sharedFiles.length})
            </button>
          </div>

          {activeTab === 'threads' && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {senderThreads.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`p-2 rounded-lg cursor-pointer transition text-left text-xs ${
                    selectedThreadId === t.id
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <p className="truncate font-medium">{t.subject}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {new Date(t.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {sharedFiles.map((f, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="truncate text-slate-700 dark:text-slate-300">{f.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 ml-2">
                    {f.size}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Private Contact Notes */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632] text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1.5 font-medium text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>Relationship Notes</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
            {contact?.notes || 'Key enterprise partner. Working on Q4 billing integration.'}
          </p>
        </div>
      </div>
    </aside>
  );
}

