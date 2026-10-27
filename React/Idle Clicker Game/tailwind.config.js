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
        'bg-canvas': '#05070B',
        'surface-dock': 'rgba(12, 16, 29, 0.85)',
        'surface-dock-solid': '#0C101D',
        'surface-card': '#13192B',
        'surface-hover': '#1C243B',
        'border-subtle': '#1E293B',
        'currency-gold': '#F59E0B',
        'production-mint': '#10B981',
        'singularity-purple': '#A855F7',
        'frenzy-crimson': '#EF4444',
        'energy-cyan': '#06B6D4',
        'text-display': '#F8FAFC',
        'text-muted': '#64748B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-gold': '0 0 25px rgba(245, 158, 11, 0.45)',
        'glow-mint': '0 0 25px rgba(16, 185, 129, 0.45)',
        'glow-purple': '0 0 30px rgba(168, 85, 247, 0.55)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.45)',
        'glow-frenzy': '0 0 35px rgba(239, 68, 68, 0.65)',
      },
      keyframes: {
        'shockwave': {
          '0%': { transform: 'scale(1)', opacity: '0.9' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'sheen': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'frenzy-pulse': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(239, 68, 68, 0.4), inset 0 0 15px rgba(239, 68, 68, 0.2)' },
          '50%': { boxShadow: '0 0 35px rgba(239, 68, 68, 0.8), inset 0 0 25px rgba(239, 68, 68, 0.4)' },
        },
        'vortex-spin': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.15)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        'float-anomaly': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(5deg)' },
        },
      },
      animation: {
        'shockwave': 'shockwave 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
        'sheen': 'sheen 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'frenzy-pulse': 'frenzy-pulse 1.2s ease-in-out infinite',
        'vortex': 'vortex-spin 20s linear infinite',
        'anomaly': 'float-anomaly 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
