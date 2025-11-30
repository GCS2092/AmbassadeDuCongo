/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7ee',
          100: '#b3e6ce',
          200: '#80d5ae',
          300: '#4dc48e',
          400: '#1ab36e',
          500: '#009639', // Congo green
          600: '#007b2e',
          700: '#006023',
          800: '#004518',
          900: '#002a0d',
        },
        secondary: {
          50: '#fff7e6',
          100: '#ffe4b3',
          200: '#ffd180',
          300: '#ffbe4d',
          400: '#ffab1a',
          500: '#e69500', // Congo gold/yellow
          600: '#b37500',
          700: '#805300',
          800: '#4d3200',
          900: '#1a1100',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

