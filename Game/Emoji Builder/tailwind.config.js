/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme 1: Berry Patisserie (Default)
        'berry-bg': '#FFF1F2',
        'berry-canvas': '#FFF8F6',
        'berry-red': '#F43F5E',
        'berry-soft': '#FFE4E6',
        'cream-pink': '#FDA4AF',
        'vanilla-custard': '#FEF3C7',
        'custard-amber': '#F59E0B',
        'matcha-mint': '#34D399',
        'matcha-soft': '#D1FAE5',
        'sugar-lavender': '#E9D5FF',

        // Theme 2: Honey Meadow
        'honey-bg': '#FEFCE8',
        'honey-canvas': '#FFFDF0',
        'honey-amber': '#F59E0B',
        'honey-deep': '#D97706',
        'pollen-yellow': '#FBBF24',
        'clover-green': '#84CC16',
        'clover-soft': '#ECFCCB',

        // Theme 3: Lavender Dream
        'lavender-bg': '#F3E8FF',
        'lavender-canvas': '#FAF5FF',
        'lavender-dream': '#8B5CF6',
        'starlight-blue': '#60A5FA',
        'buttercup-star': '#FDE047',
        'twilight-pink': '#F472B6',

        // Theme 4: Matcha Garden
        'matcha-bg': '#EBF7EE',
        'matcha-canvas': '#E2F2E7',
        'matcha-dark': '#059669',
        'matcha-cream': '#ECFDF5',
        'boba-caramel': '#D97706',

        // Theme 5: Ocean Lagoon
        'ocean-bg': '#E6F8FA',
        'ocean-canvas': '#ECFEFF',
        'lagoon-cyan': '#06B6D4',
        'seafoam-mint': '#2DD4BF',
        'coral-splash': '#FB7185',
        'pearl-blue': '#38BDF8',

        // Theme 6: Toybox Garden
        'toybox-bg': '#F5F3FF',
        'toybox-canvas': '#EEF2FF',
        'bubble-pink': '#FB7185',
        'periwinkle-clay': '#818CF8',
        'cotton-lavender': '#C084FC',

        // Theme 7: Whimsical Comic Atelier (from DESIGN.md)
        'atelier-surface': '#10131a',
        'atelier-dark': '#0b0e15',
        'atelier-panel': '#1d1f27',
        'atelier-border': '#374151',
        'atelier-primary': '#ffc174',
        'atelier-amber': '#f59e0b',
        'atelier-violet': '#8b5cf6',
        'atelier-emerald': '#10b981',
      },
      fontFamily: {
        fredoka: ['"Fredoka"', '"Sniglet"', 'sans-serif'],
        sniglet: ['"Sniglet"', 'cursive'],
        quicksand: ['"Quicksand"', 'sans-serif'],
        hand: ['"Patrick Hand"', 'cursive'],
        outfit: ['"Outfit"', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'clay-sm': 'inset 2px 2px 4px rgba(255,255,255,0.9), inset -2px -2px 4px rgba(244,63,94,0.06), 0 4px 12px rgba(244,63,94,0.12)',
        'clay-card': 'inset 3px 3px 6px rgba(255,255,255,0.95), inset -3px -3px 6px rgba(244,63,94,0.08), 0 10px 25px -4px rgba(244,63,94,0.16)',
        'clay-btn': 'inset 0 2px 4px rgba(255,255,255,0.7), 0 5px 0px rgba(190,18,60,0.22), 0 8px 16px rgba(244,63,94,0.12)',
        'marshmallow': '0 12px 30px -8px rgba(244, 63, 94, 0.16), inset 0 2px 4px rgba(255, 255, 255, 0.95)',
        'wood-frame': 'inset 0 0 0 8px #FFF5EB, inset 0 0 0 13px #E8D5C4, 0 20px 42px -10px rgba(180, 83, 9, 0.18)',
        'brutal-hard': '3px 3px 0px #000000',
        'brutal-glow': '0 0 0 1px #F59E0B, 0 0 14px rgba(245, 158, 11, 0.45)',
      },
      animation: {
        'bounce-gentle': 'bounceGentle 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'wobble': 'wobble 2.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pop-in': 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(2deg)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-4deg)' },
          '75%': { transform: 'rotate(4deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.04)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.7) opacity(0)' },
          '100%': { transform: 'scale(1) opacity(1)' },
        },
      },
    },
  },
  plugins: [],
};
