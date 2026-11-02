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
          light: '#FFFFFF',
          dark: '#0A0B0E',
        },
        surface: {
          secondary: {
            light: '#F8FAFC',
            dark: '#111318',
          },
          elevated: {
            light: '#FFFFFF',
            dark: '#171A21',
          },
        },
        divider: {
          light: '#E2E8F0',
          dark: '#222630',
        },
        brand: {
          primary: '#2563EB',
          focus: '#3B82F6',
        },
        status: {
          emerald: '#10B981',
          cobalt: '#3B82F6',
          violet: '#8B5CF6',
          amber: '#F59E0B',
          crimson: '#EF4444',
          slate: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-emerald': 'flashEmerald 0.4s ease-out',
        'bounce-short': 'bounceShort 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        flashEmerald: {
          '0%': { backgroundColor: 'rgba(16, 185, 129, 0.3)', borderColor: '#10B981' },
          '100%': { backgroundColor: 'transparent' },
        },
        bounceShort: {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}

