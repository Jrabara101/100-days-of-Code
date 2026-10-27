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
          dark: '#0B0C0E',
        },
        surface: {
          light: '#F8FAFC',
          dark: '#121417',
          elevatedLight: '#FFFFFF',
          elevatedDark: '#181A1F',
        },
        divider: {
          light: '#E2E8F0',
          dark: '#22252B',
        },
        brand: {
          DEFAULT: '#4F46E5',
          light: '#6366F1',
          dark: '#4338CA',
          glow: 'rgba(79, 70, 229, 0.25)',
        },
        accent: {
          cobalt: '#3B82F6',
          cobaltDeep: '#1D4ED8',
          emerald: '#10B981',
          crimson: '#EF4444',
          amber: '#F59E0B',
          violet: '#8B5CF6',
          rose: '#F43F5E',
          ghost: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'glow-indigo': '0 0 15px -3px rgba(99, 102, 241, 0.4)',
        'glow-crimson': '0 0 15px -3px rgba(239, 68, 68, 0.5)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
        'ripple-wave': {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.02)', filter: 'brightness(1.2)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        }
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple-wave': 'ripple-wave 0.5s ease-out',
        'shake': 'shake 0.35s ease-in-out',
      }
    },
  },
  plugins: [],
}
