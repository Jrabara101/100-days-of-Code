"use client";

import { useState } from "react";
import { ArrowRight, Bell, Zap, Tag } from "lucide-react";

const perks = [
  { icon: Bell, text: "Early access to new drops" },
  { icon: Zap, text: "Flash sale alerts" },
  { icon: Tag, text: "Exclusive member discounts" },
];

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="py-20 bg-gadget-surface/20 relative overflow-hidden">
      {/* Top gradient border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gadget-cyan to-transparent" />

      {/* Background orbs */}
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gadget-cyan/4 blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-gadget-indigo/6 blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 text-center">
        {/* Eyebrow */}
        <p className="text-gadget-cyan text-xs font-montserrat font-700 tracking-[0.25em] uppercase mb-4">
          Stay Connected
        </p>

        <h2 className="font-montserrat font-900 text-4xl lg:text-5xl leading-tight text-gadget-text mb-4">
          Get the Best Deals
          <br />
          <span className="text-gradient-cyan">Before Anyone Else</span>
        </h2>

        <p className="text-gadget-muted text-base mb-8">
          Join 50,000+ tech enthusiasts who never miss a deal, drop, or review.
        </p>

        {/* Perks */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {perks.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 text-gadget-muted text-sm bg-gadget-surface border border-gadget-border rounded-full px-4 py-2"
            >
              <Icon className="w-4 h-4 text-gadget-cyan shrink-0" />
              {text}
            </div>
          ))}
        </div>

        {/* Form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 bg-gadget-surface border border-gadget-border rounded-xl px-5 py-3.5 text-sm text-gadget-text placeholder:text-gadget-muted focus:outline-none focus:border-gadget-cyan/60 transition-colors duration-200"
            />
            <button
              type="submit"
              className="shrink-0 flex items-center gap-2 bg-gadget-cyan text-gadget-dark font-montserrat font-700 text-sm px-5 py-3.5 rounded-xl hover:bg-gadget-cyan-dark glow-cyan transition-all duration-200"
            >
              Subscribe <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-3 text-gadget-green font-montserrat font-700 text-lg animate-fade-in">
            <span className="w-8 h-8 rounded-full bg-gadget-green/10 border border-gadget-green/30 flex items-center justify-center text-sm">
              ✓
            </span>
            You&apos;re in! Welcome to the GadgetZ inner circle.
          </div>
        )}

        <p className="text-gadget-muted text-xs mt-4">
          No spam, ever. Unsubscribe anytime. We respect your privacy.
        </p>
      </div>
    </section>
  );
}
