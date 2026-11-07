import React from 'react';
import { Apple, Play, ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onOpenQR: () => void;
  onOpenHsa: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenQR, onOpenHsa }) => {
  return (
    <footer className="border-t border-white/10 bg-[#060709] text-zinc-400 text-xs py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          {/* Brand Info (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D4FF00] flex items-center justify-center font-black text-[#08090C] text-sm">
                PF
              </div>
              <span className="font-display font-extrabold text-lg text-white">
                PULSE<span className="text-[#D4FF00]">//</span>FIT
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Kinetic strength & conditioning architecture for modern athletes. Zero fluff,
              real-time biometric wearable telemetry, and adaptive 4-week splits that evolve
              with your lifestyle.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Apple HealthKit & Whoop API v2 Live
              </span>
            </div>
          </div>

          {/* Quick Links (7 cols) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Product Experience
              </span>
              <a href="#workouts" className="hover:text-white transition-colors">
                Workout Explorer
              </a>
              <a href="#plan-builder" className="hover:text-white transition-colors">
                4-Week Customizer
              </a>
              <a href="#coaches" className="hover:text-white transition-colors">
                Coach Auditions
              </a>
              <a href="#wearables" className="hover:text-white transition-colors">
                Wearable Telemetry
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Cost-Per-Sweat ROI
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Acquisition & Apps
              </span>
              <button
                onClick={onOpenQR}
                className="text-left text-[#D4FF00] hover:underline font-mono"
              >
                Scan-to-Pocket QR
              </button>
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                iOS & watchOS App <ArrowUpRight className="w-3 h-3" />
              </a>
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                Google Play Store <ArrowUpRight className="w-3 h-3" />
              </a>
              <button
                onClick={onOpenHsa}
                className="text-left text-amber-400 hover:underline font-mono"
              >
                HSA/FSA Pre-Tax
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Trust & Security
              </span>
              <span className="text-zinc-500">HIPAA Compliant</span>
              <span className="text-zinc-500">SOC2 Type II Certified</span>
              <span className="text-zinc-500">256-Bit SSL Telemetry</span>
              <span className="text-zinc-500">14-Day Free Cancellation</span>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-zinc-500">
          <div>
            © {new Date().getFullYear()} PULSEFIT INC. All rights reserved. Built with React,
            Vite, and Tailwind CSS.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-300">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-zinc-300">
              Terms of Service
            </a>
            <a href="#" className="hover:text-zinc-300">
              Biometric Notice
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
