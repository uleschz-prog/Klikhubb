import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--app-bg) / <alpha-value>)",
        foreground: "rgb(var(--app-fg) / <alpha-value>)",
        klik: {
          black: "#000000",
          green: "#30D158",
          pastel: "#A8DAB5",
          cyan: "#0A84FF",
          card: "rgb(var(--app-surface) / <alpha-value>)",
          line: "rgb(var(--app-line) / <alpha-value>)",
          mute: "rgb(var(--app-muted) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "var(--font-sans)",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "var(--font-sans)",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
