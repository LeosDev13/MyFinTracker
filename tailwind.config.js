/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // Importante para Expo Router
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        "accent-soft": "#F5EDE5",
        "primary-dark": "#1F5F43"
      }
    },
  },
  plugins: [],
};
