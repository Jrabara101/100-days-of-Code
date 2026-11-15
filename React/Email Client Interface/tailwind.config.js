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
          DEFAULT: '#FFFFFF',
          dark: '#090A0D',
        },
        surface: {
          secondary: '#F8FAFC',
          'secondary-dark': '#101217',
          tertiary: '#F1F5F9',
          'tertiary-dark': '#161922',
          elevated: '#FFFFFF',
          'elevated-dark': '#1A1D27',
        },
        divider: {
          DEFAULT: '#E2E8F0',
          dark: '#222632',
        },
        brand: {
          DEFAULT: '#2563EB',
          dark: '#3B82F6',
          muted: 'rgba(37, 99, 235, 0.1)',
        },
        primary: {
          DEFAULT: '#0F172A',
          dark: '#F8FAFC',
        },
        secondary: {
          DEFAULT: '#475569',
          dark: '#94A3B8',
        },
        muted: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'hud': '0 8px 30px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.2)',
        'dock': '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'slide-down': 'slideDown 0.15s ease-out',
        'slide-up': 'slideUp 0.15s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

