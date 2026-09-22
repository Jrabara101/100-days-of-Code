/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        void: '#030712',
        surface: {
          DEFAULT: 'rgba(11, 17, 32, 0.78)',
          subtle: 'rgba(15, 23, 42, 0.65)',
          border: 'rgba(6, 182, 212, 0.2)',
        },
        cyanPulse: '#06B6D4',
        crimsonDrop: '#F43F5E',
        energyGold: '#F59E0B',
        emeraldPulse: '#10B981',
        violetSurge: '#8B5CF6',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-spin': 'spin 12s linear infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'aurora': 'aurora 15s ease infinite alternate',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        aurora: {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '0.4' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '0.6' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '0.4' },
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.4), inset 0 0 10px rgba(6, 182, 212, 0.1)',
        'neon-crimson': '0 0 20px rgba(244, 63, 94, 0.4), inset 0 0 10px rgba(244, 63, 94, 0.1)',
        'neon-gold': '0 0 25px rgba(245, 158, 11, 0.5), inset 0 0 10px rgba(245, 158, 11, 0.1)',
        'neon-emerald': '0 0 20px rgba(16, 185, 129, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
};
