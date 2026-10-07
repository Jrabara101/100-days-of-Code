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
        background: '#090b10',
        surface: {
          DEFAULT: '#0e1117',
          dim: '#080a0f',
          container: '#151922',
          high: '#1d2330',
          highest: '#262f40',
        },
        biome: {
          overworld: '#22c55e',
          nether: '#f97316',
          depths: '#06b6d4',
          crystal_depths: '#8b5cf6',
          celestial: '#eab308',
        },
        tier: {
          common: '#10b981',
          uncommon: '#06b6d4',
          rare: '#8b5cf6',
          epic: '#ec4899',
          legendary: '#f59e0b',
        },
        primary: {
          DEFAULT: '#38bdf8',
          hover: '#0ea5e9',
          muted: '#0284c7',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'conduit-flow': 'conduitPulse 2.5s linear infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'block-bob': 'blockBob 4s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        conduitPulse: {
          '0%': { strokeDashoffset: '48' },
          '100%': { strokeDashoffset: '0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(0.98)' },
        },
        blockBob: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
