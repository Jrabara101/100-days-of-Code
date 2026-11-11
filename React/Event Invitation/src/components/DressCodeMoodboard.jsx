import React, { useState } from 'react';
import { Sparkles, Sun, ShieldCheck, Check, Info } from 'lucide-react';
import { getSunsetAdvisories } from '../services/sunCalcService';

export function DressCodeMoodboard({ event }) {
  const [selectedSwatch, setSelectedSwatch] = useState(event.moodboard.palette[0]);
  const sunsetAdvisory = getSunsetAdvisories(event.id);

  return (
    <section id="lookbook" className="w-full mt-10 p-6 sm:p-8 rounded-3xl bg-theme-inset border border-theme-border shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-6">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-theme-gold font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Visual Lookbook & Swatch Drawer</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-serif text-theme-primary font-normal">
          {event.moodboard.title}
        </h3>
        <p className="text-xs sm:text-sm text-theme-secondary max-w-xl leading-relaxed">
          {event.moodboard.note}
        </p>
      </div>

      {/* 5-Color Interactive Swatch Circles */}
      <div className="mb-6">
        <div className="text-xs font-mono uppercase tracking-wider text-theme-muted mb-3 flex items-center justify-between">
          <span>Curated Guest Color Palette (Click to Preview Fabric Advice):</span>
          <span className="font-semibold text-theme-primary">{selectedSwatch.name} ({selectedSwatch.hex})</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {event.moodboard.palette.map((swatch, idx) => {
            const isSelected = selectedSwatch.name === swatch.name;
            return (
              <button
                key={idx}
                onClick={() => setSelectedSwatch(swatch)}
                className={`group relative flex flex-col items-center p-1.5 rounded-2xl transition-all duration-300 ${
                  isSelected ? 'scale-110 ring-2 ring-theme-foil bg-theme-card shadow-md' : 'hover:scale-105'
                }`}
              >
                <div 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-inner flex items-center justify-center transition-transform group-hover:scale-105 relative"
                  style={{ backgroundColor: swatch.hex }}
                >
                  {isSelected && (
                    <Check className={`w-5 h-5 ${swatch.hex === '#E6DEC9' || swatch.hex === '#F8FAFC' ? 'text-neutral-800' : 'text-white'}`} />
                  )}
                </div>
                <span className="text-[11px] font-medium text-theme-primary mt-1.5 max-w-[80px] text-center truncate">
                  {swatch.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Swatch Description Card */}
        <div className="mt-4 p-3.5 rounded-xl bg-theme-card border border-theme-border text-xs text-theme-secondary flex items-start gap-3 animate-fadeIn">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5" 
            style={{ backgroundColor: selectedSwatch.hex }}
          ></div>
          <div>
            <span className="font-semibold text-theme-primary">{selectedSwatch.name}: </span>
            <span>{selectedSwatch.desc}</span>
          </div>
        </div>
      </div>

      {/* Footwear & Layering Cheat Sheet */}
      <div className="pt-6 border-t border-theme-border/70 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Footwear Guide */}
        <div className="p-4 rounded-2xl bg-theme-card border border-theme-border">
          <h4 className="text-xs font-mono uppercase tracking-wider text-theme-primary font-semibold mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-theme-accent" />
            <span>Terrain & Footwear Advice</span>
          </h4>
          <ul className="space-y-2 text-xs text-theme-secondary">
            {event.moodboard.tips.map((tip, tIdx) => (
              <li key={tIdx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-theme-accent mt-1.5 flex-shrink-0"></span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sunset & Golden Hour Lighting Tip */}
        <div className="p-4 rounded-2xl bg-theme-card border border-theme-border flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-theme-primary font-semibold mb-2 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Dusk & Golden Hour Photography</span>
            </h4>
            <div className="space-y-1.5 text-xs text-theme-secondary">
              <div className="flex justify-between">
                <span className="text-theme-muted">Official Sunset:</span>
                <span className="font-mono font-medium text-theme-primary">{sunsetAdvisory.sunsetTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Peak Golden Hour:</span>
                <span className="font-mono font-medium text-theme-primary">{sunsetAdvisory.goldenHour}</span>
              </div>
              <p className="mt-2 text-[11px] text-theme-muted leading-relaxed italic">
                "{sunsetAdvisory.tip}"
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-theme-border/60 flex items-center justify-between text-[11px] text-theme-muted">
            <span>Coat check & wrap warming available</span>
            <span className="font-medium text-theme-accent">Complimentary</span>
          </div>
        </div>

      </div>

    </section>
  );
}

