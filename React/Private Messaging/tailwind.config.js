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
        canvas: {
          DEFAULT: '#07080A',
          light: '#F8FAFC',
        },
        surface: {
          secondary: '#0E1015',
          'secondary-light': '#F1F5F9',
          elevated: '#14171E',
          'elevated-light': '#FFFFFF',
          bubbleIn: '#191D26',
          bubbleOut: '#0F3B2E',
        },
        divider: {
          DEFAULT: '#1D222D',
          light: '#E2E8F0',
          bubbleIn: '#252B37',
        },
        cipher: {
          emerald: '#10B981',
          cyan: '#06B6D4',
          amber: '#F59E0B',
          hazard: '#EF4444',
          silver: '#717888',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'shred': 'shredDissolve 0.8s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scanLine 3s linear infinite',
        'key-alert': 'keyAlertPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        shredDissolve: {
          '0%': { opacity: '1', transform: 'scale(1) translateY(0)', filter: 'blur(0px)' },
          '50%': { opacity: '0.6', transform: 'scale(0.98) translateY(-4px)', filter: 'blur(3px)' },
          '100%': { opacity: '0', transform: 'scale(0.92) translateY(12px)', filter: 'blur(8px)', height: '0px', margin: '0px', padding: '0px' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        keyAlertPulse: {
          '0%, 100%': { borderColor: 'rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.05)' },
          '50%': { borderColor: 'rgba(245, 158, 11, 0.8)', backgroundColor: 'rgba(245, 158, 11, 0.15)' },
        }
      }
    },
  },
  plugins: [],
}
