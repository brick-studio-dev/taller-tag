/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#FFF4ED',
          100: '#FFE4CC',
          200: '#FFC999',
          300: '#FFA566',
          400: '#FF8033',
          500: '#E8611A',
          600: '#C44C10',
          700: '#9A3B0C',
          800: '#702B08',
          900: '#461A05',
        },
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}
