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
        theme: {
          main: "var(--theme-main)",
          dark: "var(--theme-dark)",
          light: "var(--theme-light)",
          text: "var(--theme-text)",
          accent: "var(--theme-accent)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
