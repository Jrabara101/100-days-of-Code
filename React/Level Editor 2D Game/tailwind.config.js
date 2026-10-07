/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0A0C10',
        dock: '#121620',
        card: '#192030',
        borderSubtle: '#222B3D',
        accentCyan: '#06B6D4',
        accentEmerald: '#10B981',
        accentAmber: '#F59E0B',
        accentCrimson: '#EF4444',
        accentViolet: '#8B5CF6',
        textDisplay: '#F8FAFC',
        textMuted: '#64748B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glowCyan: '0 0 20px -3px rgba(6, 182, 212, 0.45)',
        glowEmerald: '0 0 20px -3px rgba(16, 185, 129, 0.45)',
        glowAmber: '0 0 20px -3px rgba(245, 158, 11, 0.45)',
        glowCrimson: '0 0 20px -3px rgba(239, 68, 68, 0.45)',
      },
    },
  },
  plugins: [],
};
