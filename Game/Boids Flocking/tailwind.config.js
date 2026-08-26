/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#030712",
          surface: "#0e131f",
          card: "#161c28",
          border: "rgba(56, 189, 248, 0.2)",
          primary: "#38bdf8",
          secondary: "#4edea3",
          accent: "#f43f5e",
          purple: "#c084fc",
          amber: "#fbbf24"
        }
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Geist'", "'Inter'", "sans-serif"],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.2))' },
        }
      }
    },
  },
  plugins: [],
}
