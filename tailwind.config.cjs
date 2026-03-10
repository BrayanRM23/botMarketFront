/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          400: '#a5b4fc',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#3730A3',
        },
      },
    },
  },
  plugins: [],
};