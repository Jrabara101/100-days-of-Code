/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'magma-950': '#080402',
        'magma-900': '#120804',
        'magma-850': '#1b0d07',
        'magma-800': '#26130a',
        'magma-700': '#381a0e',
        'magma-600': '#4f2312',
        'ember-orange': '#FF5722',
        'ember-core': '#F97316',
        'solar-gold': '#FBBF24',
        'crimson-heat': '#DC2626',
        'cooling-cyan': '#38BDF8',
        'electric-violet': '#A855F7',
        'emerald-life': '#10B981',
        'surface-dark': '#0e0907',
        'surface-container': '#170f0b',
        'surface-container-high': '#231610',
        'surface-container-highest': '#332017',
        'text-primary': '#fceee6',
        'text-muted': '#9c8175',
        'text-dim': '#695349',
      },
      fontFamily: {
        chakra: ['"Chakra Petch"', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translate(-4px, 3px) rotate(-1deg)' },
          '20%, 40%, 60%, 80%': { transform: 'translate(4px, -3px) rotate(1deg)' },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 15px rgba(255, 87, 34, 0.4), inset 0 0 10px rgba(251, 191, 36, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(249, 115, 22, 0.8), inset 0 0 20px rgba(255, 87, 34, 0.5)',
          },
        },
        heatwave: {
          '0%, 100%': { filter: 'hue-rotate(0deg) brightness(1)' },
          '50%': { filter: 'hue-rotate(6deg) brightness(1.08)' },
        },
        floatDamage: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.8)' },
          '20%': { opacity: '1', transform: 'translateY(-10px) scale(1.2)' },
          '80%': { opacity: '1', transform: 'translateY(-30px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-45px) scale(0.8)' },
        },
        slashVfx: {
          '0%': { transform: 'scaleX(0) rotate(-20deg)', opacity: '1' },
          '50%': { transform: 'scaleX(1.4) rotate(-10deg)', opacity: '1' },
          '100%': { transform: 'scaleX(1.8) rotate(0deg)', opacity: '0' },
        },
        staggerShatter: {
          '0%': { transform: 'scale(1)', filter: 'brightness(2)' },
          '50%': { transform: 'scale(1.08)', filter: 'brightness(3)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1)' },
        },
      },
      animation: {
        shake: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
        'pulse-glow': 'pulseGlow 2.4s infinite',
        'heat-shimmer': 'heatwave 4s ease-in-out infinite',
        'float-damage': 'floatDamage 1.2s ease-out forwards',
        'slash-vfx': 'slashVfx 0.35s ease-out forwards',
        'stagger-shatter': 'staggerShatter 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
