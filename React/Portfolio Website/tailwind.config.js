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
          light: '#FAFAF8',
          dark: '#0A0A0C',
        },
        surface: {
          secondary: {
            light: '#F4F4F0',
            dark: '#131316',
          },
          elevated: {
            light: '#FFFFFF',
            dark: '#1A1A1F',
          },
        },
        border: {
          subtle: {
            light: '#E5E5DF',
            dark: '#24242A',
          },
        },
        primary: {
          light: '#18181B',
          dark: '#F4F4F6',
        },
        muted: {
          light: '#71717A',
          dark: '#A1A1AA',
        },
        accent: {
          emerald: '#10B981',
          indigo: '#6366F1',
          ochre: '#F59E0B',
        },
        stage: {
          seedling: '#10B981',
          budding: '#F59E0B',
          evergreen: '#6366F1',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Charter', 'Georgia', 'serif'],
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Geist Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'radar-pulse': 'radarPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'burst-float': 'burstFloat 0.8s ease-out forwards',
      },
      keyframes: {
        radarPulse: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '70%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        burstFloat: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '1' },
          '50%': { transform: 'translateY(-24px) scale(1.15)', opacity: '0.9' },
          '100%': { transform: 'translateY(-48px) scale(0.9)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
