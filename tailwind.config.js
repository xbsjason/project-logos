/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFDFB',
          100: '#F5F5F0', 
          200: '#EBEBE0',
          300: '#D6D6C2',
          DEFAULT: '#F5F5F0'
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E5C860',
          dark: '#B39122'
        },
        navy: {
          DEFAULT: '#1A2A3A',
          light: '#2C4258',
          dark: '#0F1A24'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
