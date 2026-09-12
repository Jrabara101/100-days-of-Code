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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        cyber: {
          cyan: "#00f0ff",
          magenta: "#ff007f",
          yellow: "#ffe600",
          purple: "#9d00ff",
          dark: "#0a0a12",
          surface: "rgba(15, 17, 28, 0.75)",
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'laser-flicker': 'laserFlicker 0.15s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 12px rgba(0,240,255,0.7))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 4px rgba(0,240,255,0.3))' },
        },
        laserFlicker: {
          '0%': { opacity: '0.85' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
