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
        salon: {
          base: 'var(--canvas-salon-base)',
          card: 'var(--surface-comment-card)',
          nested: 'var(--surface-thread-nested)',
          author: 'var(--surface-author-highlight)',
          unread: 'var(--surface-unread-pulse)',
          border: 'var(--border-hairline)',
          'rail-idle': 'var(--spine-rail-idle)',
          'rail-hover': 'var(--spine-rail-hover)',
          'ink-primary': 'var(--text-ink-primary)',
          'ink-secondary': 'var(--text-ink-secondary)',
          'ink-muted': 'var(--text-ink-muted)',
          emerald: '#10B981',
          amber: '#D97706',
          indigo: '#4F46E5',
          rose: '#E11D48',
          purple: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Newsreader"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounceSoft 0.25s ease-out',
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.65', transform: 'scale(1.05)' },
        },
        bounceSoft: {
          '0%': { transform: 'scale(0.92)' },
          '60%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

