import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Send, CheckCircle2, ShieldCheck, Clock, Sparkles, MessageSquare, Briefcase, Terminal, Coffee } from 'lucide-react';
import { InquiryIntent, BudgetTier, Inquiry } from '../types';
import { StorageEngine } from '../lib/storage';

interface ContactConsoleProps {
  onInquirySubmitted?: (inquiry: Inquiry) => void;
}

export const ContactConsole: React.FC<ContactConsoleProps> = ({ onInquirySubmitted }) => {
  const [intent, setIntent] = useState<InquiryIntent>('project_engagement');
  const [senderName, setSenderName] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('10k_25k');
  const [timeline, setTimeline] = useState<string>('Q4 2026 (~4-6 weeks)');
  const [message, setMessage] = useState<string>('');
  
  // Anti-spam honeypot (Invisible to real users)
  const [honeypotValue, setHoneypotValue] = useState<string>('');
  
  // Rate-limiting timestamp
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<Inquiry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Intent configurations
  const intentPills: Array<{ id: InquiryIntent; label: string; icon: React.ReactNode; placeholder: string }> = [
    {
      id: 'project_engagement',
      label: '🚀 New Venture / Full-Stack Build',
      icon: <Briefcase className="w-3.5 h-3.5" />,
      placeholder: 'Briefly describe your vision, product goals, tech stack preferences, and scope...',
    },
    {
      id: 'design_systems',
      label: '🛠 Design System & Architecture',
      icon: <Terminal className="w-3.5 h-3.5" />,
      placeholder: 'Tell me about your existing component libraries, token pipeline challenges, and a11y requirements...',
    },
    {
      id: 'advisory_speaking',
      label: '🎙 Advisory / Speaking',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      placeholder: 'Share event details, keynote or workshop topic, expected dates, and audience size...',
    },
    {
      id: 'coffee_chat',
      label: '☕ Casual Coffee / Mentorship',
      icon: <Coffee className="w-3.5 h-3.5" />,
      placeholder: 'What problem or essay topic sparked your curiosity? Open to ideas and great questions...',
    },
  ];

  const currentIntentConfig = intentPills.find(p => p.id === intent) || intentPills[0];
  const requiresBudget = intent === 'project_engagement' || intent === 'design_systems';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Anti-spam Sentinel 1: Honeypot trap
    if (honeypotValue.trim() !== '') {
      console.warn('Bot detected via honeypot sentinel.');
      // Silently pretend success to deceive bot scripts
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmittedInquiry({
          id: 'bot-inq',
          sender_name: senderName || 'Anonymous',
          sender_email: senderEmail,
          intent,
          message,
          status: 'archived',
          ip_hash: 'bot_trap',
          created_at: new Date().toISOString(),
        });
      }, 500);
      return;
    }

    // Anti-spam Sentinel 2: Rate limiting (10 seconds between submissions)
    const now = Date.now();
    if (now - lastSubmitTime < 10000) {
      setErrorMessage('Please wait a moment before sending another inquiry.');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await StorageEngine.submitInquiry({
        sender_name: senderName.trim(),
        sender_email: senderEmail.trim(),
        intent,
        budget_tier: requiresBudget ? budgetTier : null,
        timeline: requiresBudget ? timeline : undefined,
        message: message.trim(),
      });

      setLastSubmitTime(now);
      setSubmittedInquiry(created);
      if (onInquirySubmitted) onInquirySubmitted(created);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10B981', '#6366F1', '#F59E0B'],
      });
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again or reach out directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedInquiry(null);
    setMessage('');
  };

  return (
    <section id="contact" className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-accent-indigo uppercase tracking-wider mb-3 font-semibold px-3 py-1 rounded-full bg-accent-indigo/10 border border-accent-indigo/20">
            <Sparkles className="w-3 h-3" />
            <span>Section 03 / Opportunity Gateway</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-primary-light dark:text-primary-dark tracking-tight mb-4">
            Have a project in mind? Let's build something exceptional.
          </h2>

          <p className="text-base text-muted-light dark:text-muted-dark font-sans leading-relaxed">
            Direct intake for high-intent product builds, systems architecture, and advisory. Adapt the console below to fit your inquiry.
          </p>
        </div>

        {/* Serene Confirmation Card (Success State) */}
        {submittedInquiry ? (
          <div className="p-8 sm:p-12 rounded-3xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark shadow-2xl text-center space-y-6 animate-slide-up max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-accent-emerald/10 text-accent-emerald mx-auto flex items-center justify-center ring-8 ring-accent-emerald/5">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-accent-emerald font-semibold">
                Inquiry Successfully Logged
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif text-primary-light dark:text-primary-dark mt-2">
                Thank you, {submittedInquiry.sender_name}.
              </h3>
              <p className="text-muted-light dark:text-muted-dark text-sm font-sans mt-2 leading-relaxed">
                Your dispatch regarding <span className="font-semibold text-primary-light dark:text-primary-dark">{currentIntentConfig.label}</span> has been securely delivered to my personal CRM.
              </p>
            </div>

            {/* SLA Reminder Badge */}
            <div className="p-4 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/50 dark:bg-surface-secondary-dark/50 flex items-center justify-center space-x-2 text-xs font-mono text-muted-light dark:text-muted-dark">
              <Clock className="w-4 h-4 text-accent-indigo" />
              <span>Typical response SLA: Usually responds within 24 hours.</span>
            </div>

            {/* Automated Receipt Simulation */}
            <div className="text-left p-4 rounded-xl border border-border-subtle-light/60 dark:border-border-subtle-dark/60 bg-surface-secondary-light/20 dark:bg-surface-secondary-dark/20 text-xs font-mono space-y-1.5 text-muted-light dark:text-muted-dark">
              <div className="flex justify-between border-b border-border-subtle-light/40 dark:border-border-subtle-dark/40 pb-1.5 font-semibold text-primary-light dark:text-primary-dark">
                <span>Confirmation Dispatch Receipt</span>
                <span>ID: {submittedInquiry.id}</span>
              </div>
              <p>Recipient: {submittedInquiry.sender_email}</p>
              <p>Sent: {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(submittedInquiry.created_at))}</p>
              {submittedInquiry.budget_tier && (
                <p>Budget Tier: {submittedInquiry.budget_tier.replace('_', ' ')}</p>
              )}
            </div>

            <button
              onClick={handleResetForm}
              className="px-6 py-2.5 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark text-xs font-mono text-primary-light dark:text-primary-dark transition-colors"
            >
              Send Another Note
            </button>
          </div>
        ) : (
          /* Active Contact Gateway Form */
          <div className="rounded-3xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark shadow-xl overflow-hidden p-6 sm:p-10">
            {/* 1. Segmented Intent Selector */}
            <div className="mb-8">
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-light dark:text-muted-dark font-semibold mb-3">
                1. Select Engagement Intent
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {intentPills.map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setIntent(pill.id)}
                    className={`flex items-center space-x-2.5 p-3.5 rounded-xl border text-xs font-mono transition-all text-left ${
                      intent === pill.id
                        ? 'border-accent-indigo bg-accent-indigo/10 text-accent-indigo font-semibold shadow-sm'
                        : 'border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark hover:border-border-subtle-light'
                    }`}
                  >
                    <span>{pill.icon}</span>
                    <span className="truncate">{pill.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Adaptive Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Anti-Spam Honeypot Field (Hidden with CSS & tabIndex -1) */}
              <div className="opacity-0 absolute -z-10 h-0 w-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <label htmlFor="company_tax_token">Do not fill this field</label>
                <input
                  type="text"
                  id="company_tax_token"
                  name="company_tax_token"
                  tabIndex={-1}
                  value={honeypotValue}
                  onChange={(e) => setHoneypotValue(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted-light dark:text-muted-dark font-semibold mb-2">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full px-4 py-3 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/50 dark:bg-surface-secondary-dark/50 text-sm font-sans placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-none focus:border-accent-indigo transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted-light dark:text-muted-dark font-semibold mb-2">
                    Professional Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="elena@company.com"
                    className="w-full px-4 py-3 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/50 dark:bg-surface-secondary-dark/50 text-sm font-sans placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-none focus:border-accent-indigo transition-colors"
                  />
                </div>
              </div>

              {/* Conditional Budget Tier & Timeline (Rendered when project/design system selected) */}
              {requiresBudget && (
                <div className="p-5 rounded-2xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/30 dark:bg-surface-secondary-dark/30 space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-muted-light dark:text-muted-dark font-semibold mb-2.5">
                      Scope & Budget Tier
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { id: 'under_10k', label: '< $10,000', hint: 'Sprint / Audit' },
                        { id: '10k_25k', label: '$10k – $25k', hint: 'Core MVP' },
                        { id: '25k_plus', label: '$25,000+', hint: 'Flagship Platform' },
                      ].map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setBudgetTier(tier.id as BudgetTier)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            budgetTier === tier.id
                              ? 'border-accent-emerald bg-accent-emerald/10 text-accent-emerald font-semibold shadow-sm'
                              : 'border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark'
                          }`}
                        >
                          <span className="block text-xs sm:text-sm font-mono font-medium">
                            {tier.label}
                          </span>
                          <span className="block text-[10px] text-muted-light dark:text-muted-dark mt-0.5">
                            {tier.hint}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-muted-light dark:text-muted-dark font-semibold mb-2">
                      Target Timeline / Launch
                    </label>
                    <input
                      type="text"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      placeholder="e.g. Q4 2026 (starting in ~4 weeks)"
                      className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-xs font-mono placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-none focus:border-accent-indigo"
                    />
                  </div>
                </div>
              )}

              {/* Message Textarea */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-light dark:text-muted-dark font-semibold mb-2">
                  Project Notes & Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={currentIntentConfig.placeholder}
                  className="w-full p-4 rounded-xl border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/50 dark:bg-surface-secondary-dark/50 text-sm font-sans placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-none focus:border-accent-indigo transition-colors"
                />
              </div>

              {errorMessage && (
                <p className="text-xs font-mono text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  {errorMessage}
                </p>
              )}

              {/* Bottom Actions & Trust Sentinel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center space-x-2 text-xs font-mono text-muted-light dark:text-muted-dark">
                  <ShieldCheck className="w-4 h-4 text-accent-emerald shrink-0" />
                  <span>No spam. Zero-tracking. Usually responds within 24 hours.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-primary-light dark:bg-primary-dark text-white dark:text-zinc-900 font-mono text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-md shrink-0 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Dispatched...</span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};
