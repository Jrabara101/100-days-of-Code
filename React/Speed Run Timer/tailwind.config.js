/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          void: '#050508',
          base: '#08080c',
          surface: '#0d0e15',
          card: '#11131f',
          overlay: '#141724',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-active': 'rgba(0, 240, 255, 0.3)',
        },
        neon: {
          cyan: '#00f0ff',
          gold: '#ffb800',
          emerald: '#00ff88',
          ruby: '#ff2a5f',
          purple: '#8a2be2',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -2px rgba(0, 240, 255, 0.45)',
        'glow-gold': '0 0 24px 0px rgba(255, 184, 0, 0.55)',
        'glow-emerald': '0 0 20px -2px rgba(0, 255, 136, 0.45)',
        'glow-ruby': '0 0 20px -2px rgba(255, 42, 95, 0.45)',
        'glow-purple': '0 0 20px -2px rgba(138, 43, 226, 0.45)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gold-flare': 'goldFlare 1.8s ease-out infinite',
        'surge': 'surgePulse 0.6s ease-in-out',
        'radar': 'radarSweep 3s linear infinite',
      },
      keyframes: {
        goldFlare: {
          '0%, 100%': { borderColor: 'rgba(255, 184, 0, 0.3)', boxShadow: '0 0 10px rgba(255, 184, 0, 0.2)' },
          '50%': { borderColor: 'rgba(255, 184, 0, 0.9)', boxShadow: '0 0 25px rgba(255, 184, 0, 0.7)' },
        },
        surgePulse: {
          '0%': { transform: 'scale(0.98)', opacity: '0.8' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
    },
  },
  plugins: [],
}
