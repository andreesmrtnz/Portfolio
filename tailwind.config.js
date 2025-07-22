/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{html,js}",
    "./*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      colors: {
        'space-blue': '#3b82f6',
        'space-dark': '#0a0a1a',
        'space-purple': '#1a1a3a',
      }
    },
  },
  plugins: [],
} 