/** @type {import('tailwindcss').Config} */
// Replaces the Play CDN + inline config that used to live in the HTML pages.
// After changing classes in public/**, run `npm run build:css` and commit
// public/css/tailwind.css (the host serves it as-is; no build step needed).
export default {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        void: { 950: "#04050a", 900: "#080a14", 800: "#0d1020", 700: "#12162a" },
        neon: { cyan: "#22d3ee", violet: "#a78bfa", fuchsia: "#e879f9", green: "#4ade80" },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'Inter'", "sans-serif"],
      },
    },
  },
};
