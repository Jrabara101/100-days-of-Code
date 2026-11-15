/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: 'var(--bg-canvas)',
        'surface-secondary': 'var(--bg-surface-secondary)',
        'surface-tertiary': 'var(--bg-surface-tertiary)',
        'surface-elevated': 'var(--bg-surface-elevated)',
        divider: 'var(--border-divider)',
        'txt-primary': 'var(--text-primary)',
        'txt-muted': 'var(--text-muted)',
        brand: 'var(--brand-primary)',
        'inbound-bubble': 'var(--inbound-bubble)',
        'inbound-border': 'var(--inbound-border)',
        'thread-accent': '#8B5CF6',
      },
      keyframes: {
        'bubble-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'flash-anchor': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)' },
          '25%, 65%': { boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.45)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
      },
      animation: {
        'bubble-in': 'bubble-in 180ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'flash-anchor': 'flash-anchor 1.4s ease-out',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

