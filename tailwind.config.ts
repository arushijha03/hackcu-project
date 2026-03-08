import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cu-gold": "#CFB87C",
        "cu-gold-dark": "#8D7334",
        "cu-black": "#000000",
        "cu-dark-gray": "#565A5C",
        "cu-light-gray": "#A2A4A3",
        "cu-light-gold": "#F3F0E9",
        "cu-sky-blue": "#096FAE",
        "cu-dark-blue": "#0A3758",
        "cu-light-blue": "#EEF5F8",
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
