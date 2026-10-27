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
          dark: '#0A0B0D',
        },
        surface: {
          light: '#FFFFFF',
          secondaryLight: '#F8FAFC',
          dark: '#171A20',
          secondaryDark: '#121418',
        },
        borderLight: '#E2E8F0',
        borderDark: '#232730',
        textPrimaryLight: '#0F172A',
        textPrimaryDark: '#F8FAFC',
        textMutedLight: '#64748B',
        textMutedDark: '#8F98A8',
        emeraldBrand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        cobaltBrand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3B82F6',
          600: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'elevated-dark': '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
      },
      animation: {
        'laser': 'laserSweep 1.5s ease-in-out infinite alternate',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        laserSweep: {
          '0%': { transform: 'translateY(0%)', opacity: '0.9' },
          '100%': { transform: 'translateY(100%)', opacity: '0.4' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
