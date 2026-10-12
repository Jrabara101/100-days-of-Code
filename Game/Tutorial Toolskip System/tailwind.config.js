/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#07090E',
        dock: '#0E1424CC',
        card: '#141C30',
        'border-subtle': '#1E293B',
        'playhead-beam': '#38BDF8',
        'record-pulse': '#EF4444',
        'marker-kill': '#F59E0B',
        'marker-death': '#F43F5E',
        'marker-ability': '#8B5CF6',
        'marker-objective': '#10B981',
        'ghost-trail': '#06B6D466',
        'text-display': '#F8FAFC',
        'text-muted': '#64748B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-ping': 'glowPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        glowPing: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.3)', opacity: '0.2' },
          '100%': { transform: 'scale(1)', opacity: '0.8' },
        },
        scanline: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        }
      }
    },
  },
  plugins: [],
}
