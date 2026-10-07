/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        chassis: {
          void: '#08090D',
          DEFAULT: '#0C0E14',
          card: '#131722',
          elevated: '#1C2232',
        },
        border: {
          subtle: '#1E2538',
          focus: '#38BDF8',
          DEFAULT: '#1E2538',
        },
        state: {
          listening: '#F59E0B',
          conflict: '#EF4444',
          modified: '#10B981',
          cyan: '#38BDF8',
          purple: '#A855F7',
        },
        keycap: {
          DEFAULT: '#1E2433',
          hover: '#283145',
          active: '#141824',
        },
        avionics: {
          green: '#10B981',
          amber: '#F59E0B',
          crimson: '#EF4444',
          cyan: '#06B6D4',
          sky: '#38BDF8',
          blue: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px -3px rgba(56, 189, 248, 0.35)',
        'glow-amber': '0 0 18px -2px rgba(245, 158, 11, 0.45)',
        'glow-crimson': '0 0 18px -2px rgba(239, 68, 68, 0.45)',
        'glow-emerald': '0 0 15px -3px rgba(16, 185, 129, 0.35)',
        'tactile-bevel': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 2px 4px 0 rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.25s ease-in-out',
        'radar-sweep': 'sweep 4s linear infinite',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
};
