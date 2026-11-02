import React, { useState } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { DINING_ZONES } from '../data/mockData';
import { Eye, Users, Volume2, Flame, Sparkles } from 'lucide-react';

export default function FloorplanCanvas({ onTableSelect, selectedTableId }) {
  const {
    tables,
    selectedZone,
    hoveredTable,
    setHoveredTable,
    activeHeldTableId,
    holdTimerSeconds
  } = useRestaurant();

  // Highlight tables based on selected zone filter
  const isTableHighlighted = (table) => {
    if (selectedZone === 'all') return true;
    return table.zone_id === selectedZone;
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[500px] rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] overflow-hidden shadow-inner flex flex-col justify-between">
      
      {/* Blueprint Grid & Architectural Backdrop */}
      <svg
        viewBox="0 0 800 520"
        className="w-full h-full select-none"
        style={{ filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))' }}
      >
        <defs>
          <pattern id="archGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[var(--border-hairline)]/30" />
          </pattern>
          <radialGradient id="hearthGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C84B31" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C84B31" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Blueprint background grid */}
        <rect width="800" height="520" fill="url(#archGrid)" />

        {/* Zone Outlines & Architectural Walls */}
        
        {/* 1. Open Kitchen & Hearth Enclosure (Top Left) */}
        <g id="zone-kitchen-svg">
          <rect x="170" y="25" width="280" height="60" rx="8" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
          <circle cx="310" cy="55" r="30" fill="url(#hearthGlow)" />
          <text x="310" y="58" textAnchor="middle" className="text-[11px] font-mono-numbers fill-[var(--brand-primary)] font-semibold tracking-wider">
            🔥 WHITE OAK HEARTH &amp; PASS
          </text>
        </g>

        {/* 2. Main Dining Room Boundary (Center Left) */}
        <g id="zone-main-svg">
          <rect x="80" y="210" width="460" height="170" rx="12" fill="none" stroke="var(--border-hairline)" strokeDasharray="4 4" strokeWidth="1" />
          <text x="95" y="235" className="text-[10px] font-mono-numbers fill-[var(--text-muted)] tracking-widest uppercase">
            Salon // Main Dining Room (~64 dB)
          </text>
        </g>

        {/* 3. Heated Courtyard Boundary (Right Side) */}
        <g id="zone-courtyard-svg">
          <rect x="560" y="70" width="210" height="280" rx="16" fill="var(--bg-surface)" fillOpacity="0.4" stroke="var(--border-hairline)" strokeWidth="1.5" />
          
          {/* Olive Tree Symbol */}
          <circle cx="665" cy="210" r="28" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" />
          <text x="665" y="214" textAnchor="middle" className="text-[10px] font-mono-numbers fill-emerald-600 font-medium">
            🌿 100-YR OLIVE
          </text>

          <text x="665" y="95" textAnchor="middle" className="text-[10px] font-mono-numbers fill-[var(--text-muted)] tracking-widest uppercase">
            Olive Courtyard • 68°F
          </text>
        </g>

        {/* 4. Semi-Private Wine Vault (Bottom Center) */}
        <g id="zone-vault-svg">
          <rect x="230" y="405" width="280" height="100" rx="8" fill="var(--wine-fill)" stroke="var(--wine-border)" strokeWidth="1.5" />
          <text x="370" y="425" textAnchor="middle" className="text-[10px] font-mono-numbers fill-[var(--wine-text)] tracking-widest uppercase font-medium">
            Subterranean Wine Vault (1,800 Bottles • ~54 dB)
          </text>
        </g>

        {/* Architectural Features: Entrance & Host Stand */}
        <path d="M 30 290 L 80 290" stroke="var(--border-hairline)" strokeWidth="2" />
        <text x="45" y="280" className="text-[9px] font-mono-numbers fill-[var(--text-muted)] tracking-wider">
          ENTRANCE
        </text>

        {/* Render Interactive Table Nodes */}
        {tables.map(table => {
          const isSelected = selectedTableId === table.id;
          const isHovered = hoveredTable?.id === table.id;
          const isHeld = activeHeldTableId === table.id;
          const highlighted = isTableHighlighted(table);

          // Status colors
          let fillColor = 'var(--bg-elevated)';
          let strokeColor = 'var(--border-hairline)';
          let statusDotColor = '#10B981'; // green for available

          if (table.status === 'occupied') {
            strokeColor = '#6E655C';
            statusDotColor = '#71717A';
          } else if (table.status === 'held_5m' || isHeld) {
            strokeColor = '#F59E0B'; // Saffron amber hold
            statusDotColor = '#F59E0B';
          } else {
            // available
            strokeColor = '#10B981';
            statusDotColor = '#10B981';
          }

          if (isSelected) {
            strokeColor = 'var(--brand-primary)';
            fillColor = 'var(--brand-primary)';
          }

          const opacity = highlighted ? 1 : 0.25;

          return (
            <g
              key={table.id}
              onClick={() => onTableSelect && onTableSelect(table)}
              onMouseEnter={() => setHoveredTable(table)}
              onMouseLeave={() => setHoveredTable(null)}
              className="cursor-pointer transition-transform duration-200"
              style={{ opacity }}
            >
              {/* Table Shape */}
              {table.shape === 'round' || table.shape === 'counter' ? (
                <circle
                  cx={table.svg_x + table.svg_width / 2}
                  cy={table.svg_y + table.svg_height / 2}
                  r={table.svg_width / 2}
                  fill={isSelected ? 'var(--brand-primary)' : fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                  className={`transition-all ${isHovered ? 'filter drop-shadow-md' : ''}`}
                />
              ) : (
                <rect
                  x={table.svg_x}
                  y={table.svg_y}
                  width={table.svg_width}
                  height={table.svg_height}
                  rx={table.shape === 'booth' ? 10 : 6}
                  fill={isSelected ? 'var(--brand-primary)' : fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                  className={`transition-all ${isHovered ? 'filter drop-shadow-md' : ''}`}
                />
              )}

              {/* Status Indicator Dot */}
              <circle
                cx={table.svg_x + table.svg_width - 8}
                cy={table.svg_y + 8}
                r={4}
                fill={statusDotColor}
                className={table.status === 'available' ? 'animate-pulse' : ''}
              />

              {/* Table Number & Capacity Label */}
              <text
                x={table.svg_x + table.svg_width / 2}
                y={table.svg_y + table.svg_height / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`text-[11px] font-mono-numbers font-semibold select-none ${
                  isSelected ? 'fill-white' : 'fill-[var(--text-primary)]'
                }`}
              >
                {table.table_number}
              </text>

              {/* Cover count indicator below */}
              <text
                x={table.svg_x + table.svg_width / 2}
                y={table.svg_y + table.svg_height / 2 + 13}
                textAnchor="middle"
                className={`text-[8px] font-mono-numbers select-none ${
                  isSelected ? 'fill-white/80' : 'fill-[var(--text-muted)]'
                }`}
              >
                {table.min_covers}-{table.max_covers}p
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Sightline Camera Popover Preview (Bottom Left of Floorplan) */}
      {(hoveredTable || tables.find(t => t.id === selectedTableId)) && (
        <div className="absolute bottom-3 left-3 max-w-[280px] sm:max-w-[320px] p-3 rounded-xl bg-[var(--bg-elevated)]/95 backdrop-blur-md border border-[var(--border-hairline)] shadow-xl animate-fadeIn pointer-events-none z-20">
          {(() => {
            const table = hoveredTable || tables.find(t => t.id === selectedTableId);
            const zone = DINING_ZONES.find(z => z.id === table.zone_id);
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                    <span className="text-xs font-mono-numbers font-bold text-[var(--text-primary)]">
                      Sightline: {table.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono-numbers px-2 py-0.5 rounded font-medium ${
                    table.status === 'available'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : table.status === 'held_5m'
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-zinc-500/15 text-zinc-400'
                  }`}>
                    {table.status === 'available' ? 'Available' : table.status === 'held_5m' ? '5m Hold' : 'Occupied'}
                  </span>
                </div>

                <div className="relative h-24 rounded-lg overflow-hidden border border-[var(--border-hairline)]">
                  <img
                    src={table.sightline_photo_url}
                    alt={table.sightline_caption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1.5 left-2 text-[10px] font-mono-numbers text-white/90">
                    {zone?.vibe_decibel_label}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] font-body leading-tight">
                  {table.sightline_caption}
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Floorplan Legend Pill (Top Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-3 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)]/90 backdrop-blur-md border border-[var(--border-hairline)] text-[11px] font-mono-numbers text-[var(--text-muted)] shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>5m Hold</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
          <span>Occupied</span>
        </div>
      </div>

    </div>
  );
}
