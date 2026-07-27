/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#fdf2f4',
          100: '#fbe6e9',
          200: '#f7cfd6',
          300: '#efabcb',
          400: '#e57ca8',
          500: '#cb3a76',
          600: '#a31d51',
          700: '#87133f',
          800: '#6f1136',
          900: '#58102e',
          950: '#340518',
        },
      },
    },
  },
  plugins: [],
}
