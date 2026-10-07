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
        avionics: {
          void: '#05070C',
          pill: '#0C101C',
          panel: '#111726',
          panelDark: '#090D15',
          border: '#1E293B',
          borderBright: '#334155',
          optimal: '#10B981',
          warning: '#F59E0B',
          critical: '#EF4444',
          cyan: '#06B6D4',
          cyanGlow: '#06B6D433',
          display: '#F8FAFC',
          muted: '#64748B',
          accent: '#38BDF8',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'jitter': 'jitter 80ms ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bloom-emerald': 'bloomEmerald 300ms ease-out',
      },
      keyframes: {
        jitter: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(2px)' },
          '75%': { transform: 'translateX(-2px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        bloomEmerald: {
          '0%': { borderColor: '#10B981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' },
          '100%': { borderColor: '#1E293B', boxShadow: 'none' },
        }
      }
    },
  },
  plugins: [],
}
