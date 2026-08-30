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
        'surface-lowest': '#050811',
        'surface-card': 'rgba(15, 23, 42, 0.85)',
        'surface-border': 'rgba(56, 189, 248, 0.25)',
        'cyber-cyan': '#38bdf8',
        'cyber-rose': '#f43f5e',
        'cyber-emerald': '#10b981',
        'cyber-amber': '#f59e0b',
        'cyber-gold': '#facc15',
        'cyber-purple': '#a855f7',
        'surface-container-lowest': '#0a0e17',
        'primary-container': '#38bdf8',
        'secondary-container': '#b50036',
        'on-primary-fixed': '#001e2c',
        'tertiary-fixed': '#6ffbbe',
        'surface-variant': '#1e2433',
        'on-surface': '#dfe2f0',
        'on-surface-variant': '#94a3b8',
        'surface-container-high': '#1e293b',
        'primary': '#38bdf8',
        'secondary': '#f43f5e',
        'tertiary': '#10b981',
        'p1-cyan': '#38bdf8',
        'p2-rose': '#f43f5e',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Sora"', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(56, 189, 248, 0.5)',
        'glow-rose': '0 0 15px rgba(244, 63, 94, 0.5)',
        'glow-gold': '0 0 20px rgba(250, 204, 21, 0.6)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
