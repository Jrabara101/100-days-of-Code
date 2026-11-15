import React, { useState } from 'react';
import { 
  Sliders, 
  X, 
  Plus, 
  Package, 
  Sparkles
} from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

export function RuleStudioModal() {
  const { isRuleStudioOpen, setRuleStudioOpen } = useMailStore();

  const labels = useLiveQuery(() => db.labels.orderBy('sort_order').toArray()) || [];
  const threads = useLiveQuery(() => db.threads.toArray()) || [];

  // Form states for Rule Builder
  const [ruleName, setRuleName] = useState('Auto-Route Vendor Receipts');
  const [senderDomain, setSenderDomain] = useState('figma.com, linear.app, vercel.com');
  const [subjectContains, setSubjectContains] = useState('Receipt, Invoice, Payment');
  const [selectedLabelSlug, setSelectedLabelSlug] = useState('finance');
  const [bundleInInbox, setBundleInInbox] = useState(true);
  const [skipPrimary, setSkipPrimary] = useState(false);
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  // New label form
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [isAddingLabel, setIsAddingLabel] = useState(false);

  if (!isRuleStudioOpen) return null;

  const handleToggleBundle = async (labelId, currentValue) => {
    await db.labels.update(labelId, { bundle_in_inbox: !currentValue });
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    const slug = newLabelName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await db.labels.add({
      id: `lbl_${Date.now()}`,
      name: newLabelName.trim(),
      slug,
      color_hex: newLabelColor,
      icon: 'Tag',
      bundle_in_inbox: false,
      sort_order: labels.length + 1,
    });
    setNewLabelName('');
    setIsAddingLabel(false);
  };

  const handleSaveAndApplyRule = async () => {
    const newRule = {
      id: `rul_${Date.now()}`,
      name: ruleName,
      conditions: [
        { field: 'sender_domain', operator: 'in', value: senderDomain },
        { field: 'subject', operator: 'contains', value: subjectContains },
      ],
      actions: {
        apply_labels: [selectedLabelSlug],
        bundle_in_inbox: bundleInInbox,
        skip_inbox: skipPrimary,
        mark_read: false,
        route_split: 'paper_trail',
      },
      matches_count: 42,
    };

    await db.triage_rules.add(newRule);

    // Retroactively apply to matching threads!
    const domains = senderDomain.split(',').map(d => d.trim().toLowerCase());
    const matching = threads.filter(t => 
      domains.some(d => t.primary_sender?.email?.toLowerCase().includes(d))
    );

    for (const t of matching) {
      const current = t.labels || [];
      if (!current.includes(selectedLabelSlug)) {
        await db.threads.update(t.id, {
          labels: [...current, selectedLabelSlug],
          split_category: bundleInInbox ? 'paper_trail' : t.split_category,
        });
      }
    }

    setIsSuccessToast(true);
    setTimeout(() => {
      setIsSuccessToast(false);
      setRuleStudioOpen(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in select-none">
      <div className="w-full max-w-4xl bg-white dark:bg-[#161922] border border-[#E2E8F0] dark:border-[#222632] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#222632] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Label Taxonomy & Zero-Code Triage Rule Studio
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automate inbox organization, configure Inbox Bundle roll-ups, and run retroactive batch rules.
              </p>
            </div>
          </div>

          <button
            onClick={() => setRuleStudioOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Split-Pane Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] dark:divide-[#222632]">
          {/* Left Pane: Color-Coded Label Tree & Bundle Matrix (5 cols) */}
          <div className="md:col-span-5 p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Labels & Inbox Bundling
              </span>
              <button
                onClick={() => setIsAddingLabel(!isAddingLabel)}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New Label</span>
              </button>
            </div>

            {/* Quick Add Label Form */}
            {isAddingLabel && (
              <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2 animate-slide-down">
                <input
                  type="text"
                  placeholder="Label name (e.g. Design / Figma)..."
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#1A1D27] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {['#EF4444', '#10B981', '#8B5CF6', '#3B82F6', '#F97316', '#EC4899'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewLabelColor(c)}
                        className={`w-4 h-4 rounded-full transition ${newLabelColor === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleCreateLabel}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Label List */}
            <div className="space-y-1.5">
              {labels.map((lbl) => {
                const count = threads.filter(t => t.labels?.includes(lbl.slug)).length;
                return (
                  <div
                    key={lbl.id}
                    className="p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#222632] bg-slate-50 dark:bg-[#101217] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: lbl.color_hex }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {lbl.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({count})
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleBundle(lbl.id, lbl.bundle_in_inbox)}
                      title="Toggle collapse/bundle in primary inbox"
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium transition ${
                        lbl.bundle_in_inbox
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Package className="w-3 h-3" />
                      <span>{lbl.bundle_in_inbox ? 'Bundled (📦)' : 'Separate'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Zero-Code Auto-Triage Rule Builder (7 cols) */}
          <div className="md:col-span-7 p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Create & Retroactively Apply Rule
              </span>
              <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                Zero-Code Engine
              </span>
            </div>

            {/* Rule Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rule Title:
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] bg-slate-50 dark:bg-[#101217] text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Condition Card */}
            <div className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#222632] bg-slate-50/50 dark:bg-[#101217]/50 space-y-3 text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>WHEN incoming email matches:</span>
              </p>

              <div>
                <span className="text-slate-400 text-[11px]">Sender Domain(s) equal:</span>
                <input
                  type="text"
                  value={senderDomain}
                  onChange={(e) => setSenderDomain(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#161922] text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <span className="text-slate-400 text-[11px]">OR Subject contains keywords:</span>
                <input
                  type="text"
                  value={subjectContains}
                  onChange={(e) => setSubjectContains(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#161922] text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Card */}
            <div className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#222632] bg-slate-50/50 dark:bg-[#101217]/50 space-y-3 text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>AUTOMATICALLY PERFORM:</span>
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Apply Label:</span>
                  <select
                    value={selectedLabelSlug}
                    onChange={(e) => setSelectedLabelSlug(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#161922] text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    {labels.map((l) => (
                      <option key={l.slug} value={l.slug}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bundleInInbox}
                    onChange={(e) => setBundleInInbox(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Bundle together into an expandable row in Inbox</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipPrimary}
                    onChange={(e) => setSkipPrimary(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Skip Primary Inbox (Auto-archive immediately)</span>
                </label>
              </div>
            </div>

            {/* Save CTA */}
            <div className="pt-2">
              <button
                onClick={handleSaveAndApplyRule}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save Rule & Retroactively Apply to 42 Matching Threads</span>
              </button>

              {isSuccessToast && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs text-center font-medium animate-slide-up">
                  ✓ Rule created and applied to 42 past threads successfully!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

