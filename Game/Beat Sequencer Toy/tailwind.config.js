/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        hw: {
          chassis: '#161413',
          surface: '#1E1B19',
          inset: '#0C0A09',
          border: '#2A2623',
          highlight: '#3B3531',
        },
        pad: {
          inactive: '#24201E',
          inactiveHover: '#302B28',
          border: '#36302C',
        }
      },
      boxShadow: {
        'recessed': 'inset 0 3px 8px 0 rgba(0, 0, 0, 0.7), inset 0 1px 2px 0 rgba(0, 0, 0, 0.9)',
        'pad': '0 3px 0 0 #12100F, 0 4px 6px -1px rgba(0,0,0,0.5), inset 0 1px 1px 0 rgba(255,255,255,0.08)',
        'pad-pressed': '0 1px 0 0 #12100F, inset 0 2px 4px 0 rgba(0,0,0,0.8)',
        'knob': '0 6px 12px -2px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.15)',
        'lcd': 'inset 0 2px 6px rgba(0,0,0,0.9), 0 0 15px rgba(245, 158, 11, 0.08)'
      },
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
