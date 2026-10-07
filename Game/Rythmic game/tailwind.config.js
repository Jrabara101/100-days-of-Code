/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0b10",
        surface: {
          DEFAULT: "#12131a",
          low: "#181a24",
          mid: "#222533",
          high: "#2d3145",
          highest: "#3b4059",
        },
        primary: {
          DEFAULT: "#00f0ff",
          dim: "#00b4d8",
          dark: "#0077b6",
          glow: "rgba(0, 240, 255, 0.4)",
        },
        secondary: {
          DEFAULT: "#ff007f",
          dim: "#d90368",
          glow: "rgba(255, 0, 127, 0.4)",
        },
        accent: {
          gold: "#ffd166",
          fever: "#ff0055",
          purple: "#9d4edd",
          emerald: "#06d6a0",
        },
        highway: {
          lane0: "#00f0ff", // cyan
          lane1: "#06d6a0", // green
          lane2: "#ffd166", // yellow
          lane3: "#ff007f", // pink
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.2)',
        'neon-pink': '0 0 15px rgba(255, 0, 127, 0.5), 0 0 30px rgba(255, 0, 127, 0.2)',
        'neon-gold': '0 0 15px rgba(255, 209, 102, 0.6), 0 0 30px rgba(255, 209, 102, 0.3)',
        'fever': '0 0 25px rgba(255, 0, 85, 0.8), 0 0 50px rgba(255, 0, 85, 0.4)',
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fever-pulse': 'feverPulse 1.2s ease-in-out infinite',
      },
      keyframes: {
        feverPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 10px #ff0055) saturate(1.4)' },
          '50%': { filter: 'drop-shadow(0 0 25px #ff5400) saturate(2)' },
        }
      }
    },
  },
  plugins: [],
}
