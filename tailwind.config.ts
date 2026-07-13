import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1F2933",
        paper: "#FAFAF8",
        line: "#E4E1D8",
        brand: "#2B5D5A",
        brandSoft: "#E6EDEC",
        warn: "#B3541E",
      },
      fontFamily: {
        display: ["'IBM Plex Sans Thai'", "sans-serif"],
        body: ["'IBM Plex Sans Thai'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
