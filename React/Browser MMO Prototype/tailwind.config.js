/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#060911',
        hud: {
          DEFAULT: '#0B0F19CC',
          solid: '#0B0F19',
          card: 'rgba(11, 15, 25, 0.85)',
          border: '#263147',
          slot: '#151C2C',
          slotHover: '#1E293B',
        },
        runic: {
          amber: '#F59E0B',
          cyan: '#38BDF8',
          emerald: '#10B981',
          crimson: '#EF4444',
          violet: '#A855F7',
        },
        rarity: {
          common: '#94A3B8',
          uncommon: '#4ADE80',
          rare: '#38BDF8',
          epic: '#A855F7',
          legendary: '#F59E0B',
        },
        chat: {
          local: '#F8FAFC',
          global: '#FBBF24',
          party: '#34D399',
          whisper: '#E879F9',
          system: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Plus Jakarta Sans', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'speech-pop': {
          '0%': { transform: 'scale(0.75) translateY(6px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'loot-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))' },
          '50%': { filter: 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.9))' },
        },
      },
      animation: {
        'speech-pop': 'speech-pop 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulse-subtle 2s infinite ease-in-out',
        'loot-glow': 'loot-glow 1.5s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
