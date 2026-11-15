/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Newsreader"', '"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        newsprint: {
          base: 'var(--canvas-newsprint-base)',
          card: 'var(--surface-cluster-card)',
          inset: 'var(--surface-brief-inset)',
          complete: 'var(--surface-edition-complete)',
        },
        ink: {
          primary: 'var(--text-ink-primary)',
          secondary: 'var(--text-ink-secondary)',
          muted: 'var(--text-ink-muted)',
        },
        signal: {
          emerald: '#059669',
          market: '#2563EB',
          policy: '#D97706',
          tech: '#7C3AED',
          blindspot: '#E11D48',
        },
      },
      maxWidth: {
        broadsheet: '1400px',
      },
      borderRadius: {
        cluster: '14px',
        inset: '10px',
      },
    },
  },
  plugins: [],
};

