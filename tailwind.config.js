/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cte-primary': '#FBBF24',       // Amber 400
        'cte-primary-dark': '#F59E0B',  // Darker amber (for hover/focus)
        'cte-primary-light': '#FCD34D', // Lighter amber (accent)
      },
      fontFamily: {
        'title': ['Neue Haas Unica', 'sans-serif'],
      }
    },
  },
  plugins: [],
}