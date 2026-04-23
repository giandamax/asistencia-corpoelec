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
        primary: "#b5000b",
        "primary-container": "#e30613",
        "on-surface": "#191c1d",
        "on-surface-variant": "#5e3f3b",
        surface: "#f8f9fa",
        "surface-container-low": "#f3f4f5",
        "surface-container-lowest": "#ffffff",
        "surface-container-highest": "#e1e3e4",
        "surface-dim": "#d9dadb",
        tertiary: "#475c66",
        "secondary-container": "#9fc2fe",
        "on-secondary-container": "#294f83",
        "on-primary-container": "#fff5f3",
        "on-background": "#191c1d",
        "surface-container-high": "#e7e8e9",
        "tertiary-container": "#5f747f"
      },
      fontFamily: {
        headline: ["Public Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
}
