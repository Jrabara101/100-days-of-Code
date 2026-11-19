import React, { useState } from 'react';
import { Archetype, Spot, TimeSlot, Zone } from '../types';
import { getLightingAmbiance } from '../engine/reservationEngine';
import { Sun, Moon, Volume2, ShieldCheck, Eye, Sparkles, MapPin, Coffee, CloudRain, Flame } from 'lucide-react';

interface FloorplanStageProps {
  archetype: Archetype;
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  selectedSpot: Spot | null;
  onSelectSpot: (spot: Spot) => void;
  selectedSlot: TimeSlot | null;
  onInspectSightline: (spot: Spot) => void;
  heldSpotIds?: string[];
}

export const FloorplanStage: React.FC<FloorplanStageProps> = ({
  archetype,
  selectedZoneId,
  onSelectZone,
  selectedSpot,
  onSelectSpot,
  selectedSlot,
  onInspectSightline,
  heldSpotIds = [],
}) => {
  // Lighting preview slider (minutes from midnight, default mapped to selectedSlot or 19:00 = 1140)
  const defaultMinutes = selectedSlot ? selectedSlot.minutesFromMidnight : 19 * 60;
  const [sliderMinutes, setSliderMinutes] = useState<number>(defaultMinutes);
  const [useManualLighting, setUseManualLighting] = useState<boolean>(false);

  // Derive lighting ambiance state
  const effectiveMinutes = useManualLighting ? sliderMinutes : (selectedSlot?.minutesFromMidnight ?? 19 * 60);
  const lighting = getLightingAmbiance('', effectiveMinutes);

  // Filter spots if a zone filter is active
  const allZones = archetype.zones;
  const activeZone = allZones.find(z => z.id === selectedZoneId);

  // Time formatted for slider readout
  const sliderH = Math.floor(effectiveMinutes / 60);
  const sliderM = effectiveMinutes % 60;
  const sliderPeriod = sliderH >= 12 ? 'PM' : 'AM';
  const sliderDisplayH = sliderH % 12 === 0 ? 12 : sliderH % 12;
  const formattedSliderTime = `${sliderDisplayH}:${sliderM.toString().padStart(2, '0')} ${sliderPeriod}`;

  return (
    <div className="w-full bg-white dark:bg-[#1B1F24] rounded-2xl border border-stone-800/8 dark:border-white/8 shadow-sm p-4 sm:p-5 transition-colors duration-300">
      
      {/* Floorplan Stage Header & Ambiance Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-stone-800/6 dark:border-white/6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C85A32]" />
            <h2 className="font-serif text-lg font-medium text-[#18201C] dark:text-[#F6F4F0]">
              Interactive Spatial Floorplan &amp; Vibe Explorer
            </h2>
          </div>
          <p className="text-xs text-[#525B56] dark:text-[#A0A8A3] mt-0.5">
            Click directly on any table or station to inspect view, comfort, and noise acoustics.
          </p>
        </div>

        {/* Daylight & Evening Lighting Preview Slider */}
        <div className="flex flex-wrap items-center gap-3 bg-[#FAF7F2] dark:bg-[#15181C] px-3 py-1.5 rounded-xl border border-stone-800/6 dark:border-white/6">
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#525B56] dark:text-[#A0A8A3]">
            {lighting.isNight ? <Moon className="w-3.5 h-3.5 text-amber-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            <span>{formattedSliderTime}</span>
            <span className="text-[10px] opacity-75 font-sans">({lighting.label})</span>
          </div>

          <input
            type="range"
            min={10 * 60}
            max={22 * 60 + 30}
            step={15}
            value={effectiveMinutes}
            onChange={(e) => {
              setSliderMinutes(Number(e.target.value));
              setUseManualLighting(true);
            }}
            className="w-28 sm:w-36 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#C85A32]"
            aria-label="Daylight and evening lighting preview slider"
          />

          {useManualLighting && (
            <button
              onClick={() => setUseManualLighting(false)}
              className="text-[10px] text-[#C85A32] font-mono hover:underline"
            >
              Reset to Slot
            </button>
          )}

          {/* Live Decibel Sensor */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#828B86] pl-2 border-l border-stone-300 dark:border-stone-700">
            <Volume2 className="w-3.5 h-3.5 text-[#1E6F50]" />
            <span>{selectedSpot ? `${selectedSpot.noiseDb} dB` : '54 dB'}</span>
          </div>
        </div>
      </div>

      {/* SVG Floorplan Architectural Canvas Container */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-stone-800/10 dark:border-white/10 transition-all duration-500"
        style={{
          backgroundColor: lighting.isNight ? '#121518' : '#F1ECE3',
          minHeight: '460px',
        }}
      >
        {/* Dynamic Lighting Overlay Layer */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{
            background: lighting.isNight
              ? 'radial-gradient(ellipse at 50% 40%, rgba(217, 130, 43, 0.18) 0%, rgba(14, 16, 18, 0.85) 100%)'
              : lighting.isGoldenHour
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(200, 90, 50, 0.12) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(241, 236, 227, 0.2) 100%)',
          }}
        />

        {/* Architectural Compass & Scale Indicator */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-white/80 dark:bg-[#1B1F24]/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-[#828B86] border border-stone-800/6 dark:border-white/6">
          <span>ARCH-SCALE 1:50</span>
          <span>•</span>
          <span>NORTH ⬆</span>
        </div>

        {/* Archetype SVG Canvas */}
        <svg
          viewBox="0 0 580 360"
          className="w-full h-auto min-h-[440px] select-none"
        >
          <defs>
            {/* Table Selected Glow */}
            <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#C85A32" floodOpacity="0.45" />
            </filter>

            {/* Candle/Lamp Radial Glow */}
            <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D9822B" stopOpacity={lighting.lampGlowIntensity * 0.9} />
              <stop offset="70%" stopColor="#C85A32" stopOpacity={lighting.lampGlowIntensity * 0.3} />
              <stop offset="100%" stopColor="#18201C" stopOpacity="0" />
            </radialGradient>

            {/* Floor tile pattern */}
            <pattern id="limestoneTile" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={lighting.isNight ? 'rgba(255,255,255,0.03)' : 'rgba(24,32,28,0.04)'} strokeWidth="1" />
            </pattern>
          </defs>

          {/* Background Grid Pattern */}
          <rect width="580" height="360" fill="url(#limestoneTile)" />

          {/* Archetype 1: Fine Dining Spatial Elements */}
          {archetype.id === 'fine-dining' && (
            <g className="transition-all duration-300">
              {/* Outer Walls & Arches */}
              <rect x="30" y="30" width="520" height="300" rx="12" fill="none" stroke={lighting.isNight ? '#2A3038' : '#D5CDBF'} strokeWidth="4" />
              
              {/* North Windows (Top Wall) */}
              <line x1="50" y1="30" x2="150" y2="30" stroke="#7BA8A0" strokeWidth="6" strokeLinecap="round" />
              <line x1="170" y1="30" x2="270" y2="30" stroke="#7BA8A0" strokeWidth="6" strokeLinecap="round" />
              <line x1="290" y1="30" x2="390" y2="30" stroke="#7BA8A0" strokeWidth="6" strokeLinecap="round" />
              <line x1="410" y1="30" x2="510" y2="30" stroke="#7BA8A0" strokeWidth="6" strokeLinecap="round" />
              <text x="280" y="22" textAnchor="middle" fill="#7BA8A0" fontSize="8" fontFamily="monospace" fontWeight="bold">
                COURTYARD PANORAMIC GLASS FACADE
              </text>

              {/* Courtyard Separator Partition Wall */}
              <line x1="380" y1="140" x2="380" y2="330" stroke={lighting.isNight ? '#3A424C' : '#B8AFA0'} strokeWidth="3" strokeDasharray="4 4" />
              <text x="470" y="150" textAnchor="middle" fill="#828B86" fontSize="9" fontFamily="serif" fontStyle="italic">
                Heated Olive Courtyard &amp; Fountain
              </text>

              {/* Water Fountain Circle in Courtyard */}
              <circle cx="530" cy="285" r="14" fill="none" stroke="#7BA8A0" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="530" cy="285" r="5" fill="#7BA8A0" opacity="0.6" />

              {/* Hearth / Open Fire Kitchen Bar */}
              <path d="M 50 160 L 350 160 L 350 235 L 50 235 Z" fill={lighting.isNight ? '#1A1E24' : '#E8E1D5'} stroke={lighting.isNight ? '#2E353F' : '#C7BFB2'} strokeWidth="2" rx="4" />
              <text x="60" y="153" fill="#D9822B" fontSize="9" fontFamily="monospace" fontWeight="bold">
                WOOD-FIRED HEARTH &amp; CHEF'S PASS
              </text>
              
              {/* Flame Ember Icon in Kitchen */}
              <circle cx="330" cy="195" r="16" fill="url(#lampGlow)" opacity={lighting.lampGlowIntensity} />
              <circle cx="330" cy="195" r="4" fill="#C85A32" />

              {/* Acoustic Alcove Divider */}
              <path d="M 50 250 L 310 250" stroke={lighting.isNight ? '#3A424C' : '#C7BFB2'} strokeWidth="2" strokeDasharray="5 5" />
              <text x="60" y="258" fill="#828B86" fontSize="8" fontFamily="monospace">
                ACOUSTIC VAULT (WINE ALCOVE)
              </text>
            </g>
          )}

          {/* Archetype 2: Wellness Studio Spatial Elements */}
          {archetype.id === 'wellness-studio' && (
            <g className="transition-all duration-300">
              <rect x="30" y="30" width="520" height="300" rx="12" fill="none" stroke={lighting.isNight ? '#2A3038' : '#D5CDBF'} strokeWidth="4" />
              
              {/* Front Studio Lead Mirror Wall */}
              <line x1="50" y1="35" x2="380" y2="35" stroke="#38BDF8" strokeWidth="4" />
              <text x="215" y="24" textAnchor="middle" fill="#38BDF8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                FULL-LENGTH ALIGNMENT MIRROR WALL
              </text>

              {/* Instructor Podium */}
              <rect x="180" y="42" width="70" height="18" rx="4" fill="#C85A32" opacity="0.85" />
              <text x="215" y="54" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="sans-serif" fontWeight="bold">
                COACH PODIUM
              </text>

              {/* Infrared Pod Partition Wall */}
              <line x1="380" y1="30" x2="380" y2="330" stroke={lighting.isNight ? '#3A424C' : '#B8AFA0'} strokeWidth="3" />
              <text x="465" y="55" textAnchor="middle" fill="#D9822B" fontSize="9" fontFamily="monospace" fontWeight="bold">
                PRIVATE THERMAL SUITES
              </text>
            </g>
          )}

          {/* Archetype 3: Creative & Padel Spatial Elements */}
          {archetype.id === 'creative-padel' && (
            <g className="transition-all duration-300">
              <rect x="30" y="30" width="520" height="300" rx="12" fill="none" stroke={lighting.isNight ? '#2A3038' : '#D5CDBF'} strokeWidth="4" />
              
              {/* Court Dividers & Net Lines */}
              <line x1="130" y1="70" x2="130" y2="180" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
              <line x1="130" y1="200" x2="130" y2="310" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />

              {/* Studio Partition Wall */}
              <line x1="215" y1="30" x2="215" y2="330" stroke={lighting.isNight ? '#3A424C' : '#B8AFA0'} strokeWidth="3" />
              <text x="305" y="55" textAnchor="middle" fill="#828B86" fontSize="9" fontFamily="monospace" fontWeight="bold">
                WHITE CYCLORAMA &amp; PODCAST
              </text>

              {/* Mezzanine Lounge Divider */}
              <line x1="395" y1="30" x2="395" y2="330" stroke={lighting.isNight ? '#3A424C' : '#B8AFA0'} strokeWidth="2" strokeDasharray="4 4" />
              <text x="465" y="55" textAnchor="middle" fill="#C85A32" fontSize="9" fontFamily="monospace" fontWeight="bold">
                MEZZANINE LOUNGE
              </text>
            </g>
          )}

          {/* Render All Clickable Spots / Tables for Active Archetype */}
          {allZones.flatMap(z => z.spots).map((spot) => {
            const isSelected = selectedSpot?.id === spot.id;
            const isHeldByPoll = heldSpotIds.includes(spot.id);
            const isZoneFiltered = selectedZoneId !== 'all' && spot.zoneId !== selectedZoneId;
            const isOutdoor = spot.isWeatherContingency;

            // Compute Fill and Stroke Colors
            let fillColor = lighting.isNight ? '#1E242C' : '#FFFFFF';
            let strokeColor = '#1E6F50'; // Default available emerald
            let strokeWidth = 2;
            let filterProp = undefined;
            let opacity = isZoneFiltered ? 0.35 : 1;

            if (isSelected) {
              fillColor = '#C85A32';
              strokeColor = '#FFFFFF';
              strokeWidth = 3;
              filterProp = 'url(#activeGlow)';
            } else if (isHeldByPoll) {
              fillColor = lighting.isNight ? '#2A2218' : '#FFF9F0';
              strokeColor = '#D9822B';
              strokeWidth = 2;
            }

            return (
              <g
                key={spot.id}
                onClick={() => onSelectSpot(spot)}
                className="cursor-pointer group transition-transform duration-200"
                opacity={opacity}
              >
                {/* Candle / Table Lamp Radial Glow in Evening Mode */}
                {lighting.isNight && (
                  <circle
                    cx={spot.svg.shape === 'circle' ? spot.svg.x : spot.svg.x + (spot.svg.width || 60) / 2}
                    cy={spot.svg.shape === 'circle' ? spot.svg.y : spot.svg.y + (spot.svg.height || 50) / 2}
                    r={isSelected ? 45 : 30}
                    fill="url(#lampGlow)"
                    opacity={isSelected ? 0.9 : 0.4}
                  />
                )}

                {/* Main Geometric Shape (Rect or Circle) */}
                {spot.svg.shape === 'rect' ? (
                  <rect
                    x={spot.svg.x}
                    y={spot.svg.y}
                    width={spot.svg.width || 75}
                    height={spot.svg.height || 55}
                    rx="8"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isHeldByPoll ? '4 3' : undefined}
                    filter={filterProp}
                    className="transition-all duration-200 group-hover:stroke-[#C85A32]"
                  />
                ) : (
                  <circle
                    cx={spot.svg.x}
                    cy={spot.svg.y}
                    r={spot.svg.radius || 26}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isHeldByPoll ? '4 3' : undefined}
                    filter={filterProp}
                    className="transition-all duration-200 group-hover:stroke-[#C85A32]"
                  />
                )}

                {/* Spot Code Label */}
                <text
                  x={spot.svg.shape === 'circle' ? spot.svg.x : spot.svg.x + (spot.svg.width || 75) / 2}
                  y={spot.svg.shape === 'circle' ? spot.svg.y - 4 : spot.svg.y + (spot.svg.height || 55) / 2 - 4}
                  textAnchor="middle"
                  fill={isSelected ? '#FFFFFF' : lighting.isNight ? '#F6F4F0' : '#18201C'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {spot.code}
                </text>

                {/* Capacity or Status Sub-label */}
                <text
                  x={spot.svg.shape === 'circle' ? spot.svg.x : spot.svg.x + (spot.svg.width || 75) / 2}
                  y={spot.svg.shape === 'circle' ? spot.svg.y + 10 : spot.svg.y + (spot.svg.height || 55) / 2 + 10}
                  textAnchor="middle"
                  fill={isSelected ? 'rgba(255,255,255,0.85)' : '#828B86'}
                  fontSize="8"
                  fontFamily="sans-serif"
                  className="pointer-events-none"
                >
                  {isHeldByPoll ? '🔒 HELD' : `${spot.capacityMin}-${spot.capacityMax} GUESTS`}
                </text>

                {/* Weather Contingency Badge Icon on Outdoor Patio Tables */}
                {isOutdoor && (
                  <g transform={`translate(${spot.svg.x + 8}, ${spot.svg.y - 8})`}>
                    <circle cx="6" cy="6" r="8" fill="#D9822B" />
                    <text x="6" y="9" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
                      ☂
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Selected Table Floating Sightline HUD Card */}
        {selectedSpot && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md bg-white/95 dark:bg-[#1B1F24]/95 backdrop-blur-md rounded-xl p-3.5 border border-stone-800/10 dark:border-white/10 shadow-lg shadow-black/10 animate-slide-up z-20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#C85A32] bg-[#C85A32]/10 px-2 py-0.5 rounded">
                    {selectedSpot.code}
                  </span>
                  <span className="text-xs font-semibold text-[#18201C] dark:text-[#F6F4F0]">
                    {selectedSpot.name}
                  </span>
                </div>
                <p className="text-[11px] text-[#525B56] dark:text-[#A0A8A3] mt-1 line-clamp-1">
                  {selectedSpot.sightlineSummary}
                </p>
              </div>

              <button
                onClick={() => onInspectSightline(selectedSpot)}
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#15181C] hover:bg-[#C85A32] hover:text-white text-[#525B56] dark:text-[#A0A8A3] text-xs font-mono font-medium flex items-center gap-1 transition-colors border border-stone-800/8 dark:border-white/8"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Sightline</span>
              </button>
            </div>

            {/* Vibe Pills & Acoustics */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-stone-800/6 dark:border-white/6 text-[10px]">
              <span className="text-[#1E6F50] dark:text-[#2CA376] font-mono font-semibold flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                {selectedSpot.noiseLevel}
              </span>
              <span className="text-stone-300 dark:text-stone-700">•</span>
              <span className="text-[#828B86]">{selectedSpot.comfortRating}</span>

              {selectedSpot.isWeatherContingency && (
                <span className="ml-auto text-[#D9822B] font-semibold flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  Indoor Backup Protected
                </span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Weather-Safe Patio Contingency Banner (Feature Matrix Highlight) */}
      {selectedSpot?.isWeatherContingency && (
        <div className="mt-3 p-3 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border-l-4 border-blue-500 flex items-center justify-between gap-3 text-xs text-[#18201C] dark:text-[#F6F4F0] animate-fade-in">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <p className="font-semibold text-blue-700 dark:text-blue-300">
                Weather-Safe Patio Contingency Active
              </p>
              <p className="text-[11px] text-[#525B56] dark:text-[#A0A8A3]">
                Courtyard tables are paired with an indoor shadow table (Booth 02). If rain probability exceeds 40%, you are automatically relocated inside without delay.
              </p>
            </div>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
            100% DRY GUARANTEE
          </span>
        </div>
      )}

    </div>
  );
};
