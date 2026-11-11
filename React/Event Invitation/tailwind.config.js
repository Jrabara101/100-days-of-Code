/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Cormorant Garamond"', 'serif'],
      },
      colors: {
        theme: {
          canvas: 'var(--canvas-bg)',
          card: 'var(--surface-card)',
          inset: 'var(--canvas-inset)',
          velvet: 'var(--surface-velvet)',
          border: 'var(--border-hairline)',
          foil: 'var(--border-foil)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--accent-primary)',
          gold: 'var(--accent-gold)',
          sage: 'var(--accent-sage)',
          toast: 'var(--accent-toast)',
        }
      },
      boxShadow: {
        'paper': '0 20px 50px -12px var(--shadow-color, rgba(22, 30, 25, 0.08)), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        'paper-deep': '0 25px 60px -15px var(--shadow-color, rgba(22, 30, 25, 0.16)), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        'wax': '0 10px 25px -4px rgba(184, 134, 11, 0.45), 0 4px 6px -2px rgba(184, 134, 11, 0.2)',
        'gold-glow': '0 0 25px rgba(197, 160, 89, 0.35)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}

