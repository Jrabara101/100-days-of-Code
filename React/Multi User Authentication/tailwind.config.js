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
          bg: '#0A0B0D',
          surface: '#121418',
          elevated: '#1A1D23',
          border: '#252932',
          text: '#F8FAFC',
          muted: '#8F97A6',
          brand: '#3B82F6',
        },
        light: {
          bg: '#FFFFFF',
          surface: '#F8FAFC',
          elevated: '#FFFFFF',
          border: '#E2E8F0',
          text: '#0F172A',
          muted: '#64748B',
          brand: '#2563EB',
        },
        role: {
          owner: '#7C3AED',
          admin: '#2563EB',
          manager: '#0D9488',
          member: '#10B981',
          auditor: '#64748B',
        },
        security: {
          critical: '#EF4444',
          warning: '#F59E0B',
          active: '#10B981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'vault-glow': '0 0 25px -5px rgba(59, 130, 246, 0.15)',
        'owner-glow': '0 0 20px -3px rgba(124, 58, 237, 0.2)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      }
    },
  },
  plugins: [],
}
