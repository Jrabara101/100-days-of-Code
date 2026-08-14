/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        colony: {
          dark: '#0a0d14',
          panel: '#111827',
          surface: '#1e293b',
          border: '#334155',
          accent: '#10b981',
          queen: '#ec4899',
          worker: '#f59e0b',
          soldier: '#ef4444',
          nurse: '#8b5cf6',
          scout: '#06b6d4',
          sugar: '#38bdf8',
          protein: '#f43f5e',
          leaf: '#22c55e',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
        sans: ['"Outfit"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
