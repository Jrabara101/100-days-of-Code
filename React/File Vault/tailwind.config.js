/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#001026",
        "on-primary": "#ffffff",
        "primary-container": "#0b2545",
        "on-primary-container": "#778db2",
        "secondary": "#395f95",
        "on-secondary": "#ffffff",
        "secondary-container": "#9dc3ff",
        "on-secondary-container": "#274f84",
        "tertiary": "#00130a",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#002b1b",
        "on-tertiary-container": "#1c9e71",
        "tertiary-fixed": "#85f8c4",
        "tertiary-fixed-dim": "#68dba9",
        "surface": "#f7f9ff",
        "surface-dim": "#c1ddfa",
        "surface-bright": "#f7f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#ecf4ff",
        "surface-container": "#e2efff",
        "surface-container-high": "#d7eaff",
        "surface-container-highest": "#cce5ff",
        "on-surface": "#001d31",
        "on-surface-variant": "#44474e",
        "outline": "#74777f",
        "outline-variant": "#c4c6cf",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        vault: {
          deep: '#0b2545',
          navy: '#134074',
          soft: '#5a718d',
          surface: '#f7f9ff',
          card: '#ffffff',
          cardSubtle: '#ecf4ff',
          emerald: '#059669',
          emeraldLight: '#10b981',
          accent: '#2563eb'
        }
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        headline: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      spacing: {
        margin: '1.25rem',
        'margin-mobile': '1rem',
        'gutter': '1rem',
        'gutter-mobile': '0.75rem',
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        'full': '9999px'
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 3s linear infinite',
        'shutter-flash': 'shutterFlash 0.35s ease-out forwards'
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.97)' }
        },
        radarSweep: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        },
        shutterFlash: {
          '0%': { opacity: '0.95' },
          '100%': { opacity: '0', pointerEvents: 'none' }
        }
      }
    },
  },
  plugins: [],
}

