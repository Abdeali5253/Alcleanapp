/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6DB33F',
        'primary-dark': '#5da035',
      },
    },
  },
  plugins: [],
}
