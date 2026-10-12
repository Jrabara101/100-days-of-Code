/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#070A0B',
        surface: {
          hud: '#0C1012D9',
          card: '#13191C',
          overlay: '#050708f0',
        },
        border: {
          subtle: '#1E272B',
          hazard: '#F59E0B',
        },
        hazard: {
          amber: '#F59E0B',
          glow: '#FBBF24',
        },
        bio: {
          emerald: '#10B981',
          glow: '#34D399',
        },
        blood: {
          crimson: '#EF4444',
          glow: '#F87171',
        },
        shock: {
          cyan: '#06B6D4',
          glow: '#22D3EE',
        },
        cryo: {
          ice: '#38BDF8',
          glow: '#7DD3FC',
        },
        telemetry: {
          display: '#F8FAFC',
          muted: '#64748B',
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Outfit"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-hazard': 'pulseHazard 1.5s infinite',
        'pulse-crimson': 'pulseCrimson 0.8s infinite',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseHazard: {
          '0%, 100%': { borderColor: 'rgba(245, 158, 11, 0.4)', boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)' },
          '50%': { borderColor: 'rgba(245, 158, 11, 0.9)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)' },
        },
        pulseCrimson: {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 0.4)', boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)' },
          '50%': { borderColor: 'rgba(239, 68, 68, 1.0)', boxShadow: '0 0 25px rgba(239, 68, 68, 0.7)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%': { opacity: '0.92' },
          '100%': { opacity: '1.0' },
        }
      }
    },
  },
  plugins: [],
}
