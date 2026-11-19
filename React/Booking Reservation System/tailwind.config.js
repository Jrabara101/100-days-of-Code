/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        travertine: {
          base: {
            light: '#FAF7F2',
            dark: '#0E1012',
          },
          well: {
            light: '#F1ECE3',
            dark: '#15181C',
          },
          card: {
            light: '#FFFFFF',
            dark: '#1B1F24',
          },
          pass: '#18201C',
        },
        ink: {
          primary: {
            light: '#18201C',
            dark: '#F6F4F0',
          },
          secondary: {
            light: '#525B56',
            dark: '#A0A8A3',
          },
          muted: '#828B86',
        },
        slot: {
          emerald: '#1E6F50',
          'emerald-light': '#2CA376',
          terracotta: '#C85A32',
          'terracotta-hover': '#B24E2A',
          amber: '#D9822B',
          'amber-light': '#F59E0B',
          plum: '#6D4C7D',
          'plum-light': '#8E67A1',
        }
      },
      fontFamily: {
        serif: ['"Fraunces"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'concierge': '0 20px 44px -12px rgba(24, 32, 28, 0.09)',
        'concierge-dark': '0 20px 44px -12px rgba(0, 0, 0, 0.45)',
        'tactile-pass': '0 28px 56px -16px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'seat-active': '0 0 0 4px rgba(200, 90, 50, 0.2), 0 8px 18px -4px rgba(200, 90, 50, 0.35)',
        'emerald-glow': '0 0 18px -2px rgba(30, 111, 80, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ticket-flip': 'ticketFlip 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.82', transform: 'scale(1.02)' },
        },
        ticketFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
