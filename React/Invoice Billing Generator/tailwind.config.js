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
        vault: {
          950: '#060709',
          900: '#0A0B0E',
          850: '#111318',
          800: '#161920',
          750: '#1F232D',
          700: '#2A2F3D',
          600: '#3D4556',
        },
        stripe: {
          DEFAULT: '#635BFF',
          hover: '#4F46E5',
          light: '#EEF2FF',
          dark: '#3A30B8',
        },
        paypal: {
          cobalt: '#0070BA',
          navy: '#003087',
          gold: '#FFC439',
          goldHover: '#F2B522',
        },
        ach: {
          DEFAULT: '#059669',
          light: '#D1FAE5',
          dark: '#065F46',
          emerald: '#10B981',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          cream: '#FAFAF9',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'paper': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.06)',
        'paper-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.08)',
        'glow-stripe': '0 0 20px -3px rgba(99, 91, 255, 0.35)',
        'glow-ach': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
      },
      animation: {
        'stamp-slam': 'stampBounce 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'radar-pulse': 'radarPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        stampBounce: {
          '0%': { transform: 'scale(2.2) rotate(-14deg)', opacity: '0' },
          '60%': { transform: 'scale(0.92) rotate(-8deg)', opacity: '1' },
          '80%': { transform: 'scale(1.05) rotate(-11deg)' },
          '100%': { transform: 'scale(1) rotate(-10deg)', opacity: '1' },
        },
        radarPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.2)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
