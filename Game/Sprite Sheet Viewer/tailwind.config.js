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
        void: '#08090D',
        dock: '#10131B',
        card: '#161B26',
        'border-subtle': '#1E2536',
        'accent-cyan': '#06B6D4',
        'accent-emerald': '#10B981',
        'accent-amber': '#F59E0B',
        'accent-crimson': '#EF4444',
        'accent-violet': '#8B5CF6',
        'text-display': '#F8FAFC',
        'text-muted': '#64748B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.35)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.35)',
        'glow-crimson': '0 0 15px rgba(239, 68, 68, 0.35)',
      },
    },
  },
  plugins: [],
};
