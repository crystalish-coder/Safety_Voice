import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        oncobix: {
          50: "#fdf2f4",
          100: "#fce7eb",
          200: "#f7cfd7",
          300: "#f09fb0",
          400: "#e04c66",
          500: "#c80f2e", // Brand Main Red
          600: "#b30d29",
          700: "#9a0c24", // Deep Burgundy
          800: "#800a1e",
          900: "#660818",
          gray: "#6b7380", // Slate Accent
        },
      },
    },
  },
  plugins: [],
};
export default config;
