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
        vault: {
          canvas: '#07090E',
          panel: '#0E1424',
          card: '#141C30',
          'card-hover': '#1A243D',
          border: '#1E293B',
          'border-light': '#334155',
          bronze: '#D97706',
          silver: '#94A3B8',
          gold: '#F59E0B',
          prismatic: '#A855F7',
          reward: '#10B981',
          display: '#F8FAFC',
          muted: '#64748B'
        }
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'sans-serif']
      },
      animation: {
        'shimmer-foil': 'shimmerFoil 4s linear infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'chest-cracking': 'chestShake 0.6s ease-in-out'
      },
      keyframes: {
        shimmerFoil: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.4))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.8))' }
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        chestShake: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '20%': { transform: 'scale(1.08) rotate(-3deg)' },
          '40%': { transform: 'scale(1.08) rotate(3deg)' },
          '60%': { transform: 'scale(1.12) rotate(-2deg)' },
          '80%': { transform: 'scale(1.05) rotate(1deg)' }
        }
      }
    },
  },
  plugins: [],
}
