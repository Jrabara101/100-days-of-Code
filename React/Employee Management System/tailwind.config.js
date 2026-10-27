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
          dark: '#121418',
        },
        elevated: {
          light: '#FFFFFF',
          dark: '#181B20',
        },
        divider: {
          light: '#E2E8F0',
          dark: '#232730',
        },
        brand: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          dark: '#6366F1',
          light: '#EEF2FF',
        },
        status: {
          office: {
            fill: 'rgba(16, 185, 129, 0.1)',
            text: '#059669',
            dot: '#10B981',
          },
          remote: {
            fill: 'rgba(59, 130, 246, 0.1)',
            text: '#2563EB',
            dot: '#3B82F6',
          },
          break: {
            fill: 'rgba(245, 158, 11, 0.1)',
            text: '#D97706',
            dot: '#F59E0B',
          },
          pto: {
            fill: 'rgba(139, 92, 246, 0.1)',
            text: '#7C3AED',
            dot: '#8B5CF6',
          },
          anomaly: {
            fill: 'rgba(239, 68, 68, 0.1)',
            text: '#DC2626',
            border: '#FCA5A5',
          },
          off: {
            fill: 'rgba(100, 116, 139, 0.08)',
            text: '#64748B',
            dot: '#94A3B8',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radar 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '70%': { transform: 'scale(1.7)', opacity: '0' },
          '100%': { transform: 'scale(1.7)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
