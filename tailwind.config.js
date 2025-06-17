/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        "soft-pink": "#F5EDE5",
        "medium-green": "#B8D4B8",
        "soft-green": "#D8E8D8",
        "soft-red": "#E8B4C8"
      }
    },
  },
  plugins: [],
};
