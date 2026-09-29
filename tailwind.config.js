/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#fffbe finished',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        cafe: {
          50: '#FAF6F0',
          100: '#F4ECE1',
          200: '#E6D7C3',
          300: '#D5BEA3',
          400: '#C29B7F',
          500: '#A67B5B',
          600: '#8C5E3C',
          700: '#6F432A',
          800: '#4F2D19',
          900: '#331B0E',
        }
      }
    },
  },
  plugins: [],
}
