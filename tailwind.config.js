/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts,scss}',
    './node_modules/flowbite/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        euclid: ["'Euclid Circular A'", "sans-serif"],
      },
      colors: {
        brand: { DEFAULT: '#2563eb', dark: '#1e40af', light: '#93c5fd' },
      },
      borderRadius: { '2xl': '1rem' }
    },
  },
  plugins: [require('flowbite/plugin')],
};