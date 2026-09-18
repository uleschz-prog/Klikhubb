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
        ink: {
          950: "#14110f",
          900: "#1c1814",
          800: "#2a241e",
          700: "#3d342b",
        },
        paper: {
          50: "#f7f1e8",
          100: "#efe4d4",
          200: "#e2d1b8",
        },
        cedar: {
          500: "#b4482a",
          600: "#9a3a22",
          700: "#7c2d1a",
        },
        moss: {
          700: "#2f4a3c",
          800: "#24382e",
        },
      },
      fontFamily: {
        sans: ["var(--font-figtree)", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
