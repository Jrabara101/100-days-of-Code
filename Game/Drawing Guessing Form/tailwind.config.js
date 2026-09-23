/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
        hand: ['Caveat', 'cursive'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        studio: {
          cream: '#FDFBF7',
          paper: '#F5EFEB',
          aged: '#EAE1D0',
          oat: '#E8DEC8',
          sienna: '#C85A32',
          siennaLight: '#E87D56',
          moss: '#3B5E41',
          mossLight: '#527C59',
          ink: '#1E2638',
          charcoal: '#333D4F',
          wood: '#442F24',
          woodDark: '#2E1E16',
          woodLight: '#614838',
          sticky: '#FEF9C3',
          stickyBorder: '#FDE047',
        },
      },
      boxShadow: {
        sketchbook: '0 20px 45px -10px rgba(30, 20, 10, 0.28), 0 0 0 1px rgba(100, 70, 45, 0.1)',
        'paper-lift': '0 8px 24px -4px rgba(45, 30, 20, 0.15), 0 2px 6px rgba(45, 30, 20, 0.08)',
        sticky: '2px 4px 12px rgba(60, 40, 20, 0.12), -1px 2px 4px rgba(60, 40, 20, 0.06)',
        dock: '0 12px 30px -6px rgba(40, 25, 15, 0.2)',
      },
      animation: {
        'paper-shake': 'shake 0.35s ease-in-out',
        'float-up': 'floatUp 1.2s ease-out forwards',
        steam: 'steam 3s ease-in-out infinite alternate',
        'pulse-vignette': 'vignettePulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '20%, 60%': { transform: 'translateX(-4px) rotate(-0.5deg)' },
          '40%, 80%': { transform: 'translateX(4px) rotate(0.5deg)' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.85)' },
          '25%': { opacity: '1', transform: 'translateY(-4px) scale(1.08)' },
          '75%': { opacity: '1', transform: 'translateY(-22px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-34px) scale(0.92)' },
        },
        steam: {
          '0%': { transform: 'translateY(0) scaleX(1)', opacity: '0.4' },
          '100%': { transform: 'translateY(-6px) scaleX(1.15)', opacity: '0.9' },
        },
        vignettePulse: {
          '0%, 100%': { boxShadow: 'inset 0 0 25px rgba(200, 40, 40, 0.15)' },
          '50%': { boxShadow: 'inset 0 0 50px rgba(220, 30, 30, 0.45)' },
        },
      },
    },
  },
  plugins: [],
};
