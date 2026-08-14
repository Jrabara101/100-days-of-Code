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
        "on-error-container": "#93000a",
        "on-primary-fixed-variant": "#3c4d00",
        "on-secondary-container": "#684000",
        "on-background": "#151c25",
        "inverse-primary": "#b1d43d",
        "secondary-fixed-dim": "#ffb95f",
        "error": "#ba1a1a",
        "surface-container-low": "#eef4ff",
        "on-tertiary-fixed-variant": "#75009d",
        "on-secondary-fixed": "#2a1700",
        "surface-container": "#e7eefb",
        "surface-variant": "#dce3f0",
        "tertiary": "#912abb",
        "inverse-surface": "#2a313b",
        "tertiary-fixed": "#f9d8ff",
        "surface-bright": "#f8f9ff",
        "outline-variant": "#c5c9b1",
        "on-surface": "#151c25",
        "surface": "#f8f9ff",
        "on-surface-variant": "#454936",
        "surface-container-high": "#e2e8f5",
        "primary-fixed": "#ccf157",
        "on-error": "#ffffff",
        "surface-dim": "#d4dae7",
        "secondary-fixed": "#ffddb8",
        "secondary-container": "#fea619",
        "primary-fixed-dim": "#b1d43d",
        "primary-container": "#8bac0f",
        "secondary": "#855300",
        "inverse-on-surface": "#eaf1fe",
        "error-container": "#ffdad6",
        "background": "#f8f9ff",
        "on-tertiary-fixed": "#320046",
        "tertiary-fixed-dim": "#edb1ff",
        "on-tertiary-container": "#5c007d",
        "on-secondary": "#ffffff",
        "primary": "#516600",
        "surface-container-highest": "#dce3f0",
        "surface-tint": "#516600",
        "tertiary-container": "#d976ff",
        "outline": "#757964",
        "on-primary": "#ffffff",
        "on-tertiary": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "on-primary-container": "#2e3c00",
        "on-primary-fixed": "#161e00",
        "on-secondary-fixed-variant": "#653e00"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "screen-margin": "24px",
        "unit": "4px",
        "button-gap": "12px",
        "bezel-padding": "16px",
        "container-gap": "8px"
      },
      fontFamily: {
        "label-caps": ["Courier Prime", "monospace"],
        "headline-md": ["Space Mono", "monospace"],
        "headline-lg": ["Space Mono", "monospace"],
        "body-sm": ["JetBrains Mono", "monospace"],
        "body-lg": ["JetBrains Mono", "monospace"]
      },
      fontSize: {
        "label-caps": ["12px", { lineHeight: "1.0", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.05em", fontWeight: "700" }],
        "body-sm": ["14px", { lineHeight: "1.4", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "1.5", fontWeight: "400" }]
      },
      boxShadow: {
        'lcd-inset': 'inset 0px 4px 10px rgba(0, 0, 0, 0.4), inset 0px 0px 4px rgba(0, 0, 0, 0.2)',
        'button-press': 'inset 2px 2px 5px rgba(0,0,0,0.5), 1px 1px 0px rgba(255,255,255,0.2)',
        'button-idle': '2px 2px 5px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,0.4)',
        'casing': '5px 10px 20px rgba(0,0,0,0.2), inset 2px 2px 5px rgba(255,255,255,0.3), inset -2px -2px 5px rgba(0,0,0,0.2)'
      }
    }
  },
  plugins: [],
}
