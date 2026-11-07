import React, { useState, useEffect } from 'react';
import { Smartphone, Zap, Star } from 'lucide-react';
import { useSmartDeviceDetection } from '../hooks/useSmartDeviceDetection';

interface StickyMobileDownloadDockProps {
  onOpenQR: () => void;
}

export const StickyMobileDownloadDock: React.FC<StickyMobileDownloadDockProps> = ({
  onOpenQR,
}) => {
  const { isMobile, storeName } = useSmartDeviceDetection();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past hero (e.g. 350px)
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 sm:hidden animate-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl bg-[#08090C]/90 backdrop-blur-xl border border-white/20 p-3 shadow-2xl flex items-center justify-between gap-3 glow-volt">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#D4FF00] flex items-center justify-center font-black text-[#08090C] text-xs font-mono shadow-md">
            PF
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xs font-extrabold text-white leading-tight">
              PULSE//FIT
            </span>
            <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              <span>4.9 (48k Reviews)</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenQR}
          className="h-10 px-4 rounded-xl bg-[#D4FF00] text-[#08090C] text-xs font-extrabold font-mono flex items-center gap-1.5 active:scale-95 shadow-lg whitespace-nowrap"
        >
          <Zap className="w-3.5 h-3.5 fill-[#08090C]" />
          <span>{isMobile ? `Get on ${storeName}` : 'Claim 14 Days'}</span>
        </button>
      </div>
    </div>
  );
};
