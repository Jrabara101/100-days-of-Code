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
          secondary: {
            light: '#F8FAFC',
            dark: '#121316',
          },
          elevated: {
            light: '#FFFFFF',
            dark: '#181A20',
          },
        },
        divider: {
          light: '#E2E8F0',
          dark: '#23262D',
        },
        brand: {
          cobalt: '#2563EB',
          electric: '#3B82F6',
          read: '#38BDF8',
          online: '#10B981',
          idle: '#F59E0B',
          offline: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'pop-in': 'pop-in 140ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulse-subtle 2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
