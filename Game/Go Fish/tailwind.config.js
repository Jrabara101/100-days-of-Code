/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gb-lightest': '#c4cfa1',
        'gb-light': '#8b956d',
        'gb-dark': '#4d533c',
        'gb-darkest': '#1f2219',
        'nes-green': '#00a844',
        'nes-darkgreen': '#005800',
        'nes-red': '#e40058',
        'nes-yellow': '#f8b800',
        'nes-blue': '#0078f8',
      },
      fontFamily: {
        pixel: ['DotGothic16', 'monospace'],
        pressStart: ['"Press Start 2P"', 'monospace'],
      },
      boxShadow: {
        'pixel': '4px 4px 0px 0px #000000',
        'pixel-lg': '6px 6px 0px 0px #000000',
        'pixel-sm': '2px 2px 0px 0px #000000',
        'pixel-gb': '4px 4px 0px 0px #1f2219',
      }
    },
  },
  plugins: [],
}
