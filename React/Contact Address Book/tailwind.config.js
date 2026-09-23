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
        background: "#131315",
        surface: {
          DEFAULT: "#131315",
          bright: "#39393b",
          dim: "#131315",
          variant: "#353437",
        },
        "surface-container": {
          lowest: "#0e0e10",
          low: "#1c1b1d",
          DEFAULT: "#201f22",
          high: "#2a2a2c",
          highest: "#353437",
        },
        primary: {
          DEFAULT: "#8aebff",
          container: "#22d3ee",
          fixed: "#a2eeff",
          dim: "#2fd9f4",
        },
        "on-primary": "#00363e",
        "on-primary-container": "#005763",
        secondary: {
          DEFAULT: "#c0c1ff",
          container: "#3131c0",
        },
        "on-secondary-container": "#b0b2ff",
        tertiary: {
          DEFAULT: "#68f5b8",
          container: "#46d89d",
          fixed: "#6ffbbe",
        },
        "on-tertiary": "#003824",
        "on-tertiary-container": "#005a3d",
        error: {
          DEFAULT: "#ffb4ab",
          container: "#93000a",
        },
        "on-error-container": "#ffdad6",
        outline: {
          DEFAULT: "#859397",
          variant: "#3c494c",
        },
        "on-surface": {
          DEFAULT: "#e5e1e4",
          variant: "#bbc9cd",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
