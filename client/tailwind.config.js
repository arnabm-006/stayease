/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2ead8',
          100: '#ddcda8',
          200: '#c6a45a',
          300: '#a98743',
          400: '#80652f',
          500: '#514222',
          600: '#373023',
          700: '#292a2b',
          800: '#1d1f22',
          900: '#121417',
          950: '#090a0c',
        },
        forest: {
          50: '#282115',
          100: '#40331d',
          500: '#c6a45a',
          600: '#b28f48',
          700: '#d1b56c',
          800: '#e2c986',
          900: '#f2dfaa',
        },
        emerald: {
          50: '#282115',
          100: '#40331d',
          200: '#68552d',
          300: '#92753b',
          400: '#b28f48',
          500: '#c6a45a',
          600: '#b28f48',
          700: '#d1b56c',
          800: '#e2c986',
          900: '#f2dfaa',
          950: '#faf0d5',
        },
        amber: {
          50: '#282115',
          100: '#40331d',
          200: '#68552d',
          300: '#e2c986',
          400: '#d1b56c',
          500: '#c6a45a',
          600: '#a98743',
          700: '#80652f',
          800: '#514222',
          900: '#373023',
          950: '#201c14',
        },
        gold: {
          500: '#c6a45a',
          600: '#a98743',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 30px -10px rgba(15, 36, 56, 0.08)',
        'card': '0 4px 20px -2px rgba(15, 36, 56, 0.06)',
      }
    },
  },
  plugins: [],
}
