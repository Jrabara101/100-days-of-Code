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
          light: '#F8FAFC',
          dark: '#121418',
          elevatedLight: '#FFFFFF',
          elevatedDark: '#181A20',
        },
        divider: {
          light: '#E2E8F0',
          dark: '#232730',
        },
        textPrimary: {
          light: '#0F172A',
          dark: '#F8FAFC',
        },
        textMuted: {
          light: '#64748B',
          dark: '#8F9CAE',
        },
        brand: {
          DEFAULT: '#4F46E5', // Electric Indigo
          light: '#6366F1',
          dark: '#3730A3',
          glow: 'rgba(79, 70, 229, 0.25)',
        },
        accent: {
          correct: '#10B981',
          incorrect: '#EF4444',
          logic: '#8B5CF6',
          draft: '#F59E0B',
          live: '#10B981',
          amber: '#F59E0B',
          cyan: '#06B6D4',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow-brand': '0 0 25px -4px rgba(99, 102, 241, 0.45)',
        'glow-correct': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'glow-incorrect': '0 0 20px -3px rgba(239, 68, 68, 0.4)',
      },
      keyframes: {
        'bounce-key': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-sync': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        }
      },
      animation: {
        'bounce-key': 'bounce-key 0.16s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-slide-up': 'fade-slide-up 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-slide-down': 'fade-slide-down 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-sync': 'pulse-sync 1.6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
