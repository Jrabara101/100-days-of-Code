import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: 'How does the TrueMed HSA/FSA pre-tax reimbursement work?',
    a: 'Under IRS Code 213(d), exercise programming designed to treat or prevent conditions (such as obesity, hypertension, or chronic back pain) qualifies for pre-tax health savings. During checkout or in your receipt portal, TrueMed generates an instant, physician-signed Letter of Medical Necessity (LMN). You can pay directly with your HSA/FSA card or submit the itemized receipt for ~30% tax savings.',
  },
  {
    q: 'Do I need an Apple Watch or Whoop to use PulseFit?',
    a: 'No hardware is strictly required! You can follow all 450+ coached 60fps workouts and interactive circuits using just your phone, tablet, or Apple TV. However, pairing an Apple Watch, Whoop, Garmin, or Oura unlocks live biometric heart-rate telemetry, haptic pacing pulses, and auto-adaptive rest day suggestions.',
  },
  {
    q: 'How does the 14-day zero-surprise free trial timeline work?',
    a: 'When you choose the Annual Athlete Flagship, your card is verified but charged $0.00 today. On Day 12, we send you an automated email and push reminder alert. If you do not wish to continue, cancel in 1 click in your iOS/Android app store settings before Day 14 at zero cost.',
  },
  {
    q: 'What makes the "Apartment-Friendly / Zero-Jump" workouts quiet?',
    a: 'Our biomechanics team engineered these routines with zero plyometric impacts: no burpees, tuck jumps, or floor slapping. Instead, we use isometric holds, high-velocity eccentric tempos, unilateral dumbbell presses, and kettlebell hinges to trigger maximum metabolic burn without disturbing neighbors below.',
  },
  {
    q: 'How does the "Scan-to-Pocket" 4-Week Blueprint handoff work?',
    a: 'When you configure your goals, days, and gear on this landing page, your configuration is packed into a deferred deep-link token. Scanning the QR code or texting yourself the SMS link routes you to the App Store or Google Play. On your very first app launch, your personalized 4-week calendar is already hydrated and ready to train.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-20 border-t border-white/10 relative" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111318] border border-white/10 text-zinc-300 text-xs font-mono uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-[#D4FF00]" />
            Clarity & FAQs
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-400 text-sm mt-2">
            Everything you need to know about plans, hardware, and pre-tax healthcare funds.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#111318] border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <span className="font-display text-base sm:text-lg font-bold text-white">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#D4FF00] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-sm text-zinc-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
