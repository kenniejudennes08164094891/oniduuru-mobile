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
// module.exports = {
//   theme: {
//     extend: {
//       keyframes: {
//         marqueeFast: {
//           '0%': { transform: 'translateX(100%)' },
//           '100%': { transform: 'translateX(-100%)' },
//         },
//       },
//       animation: {
//         marqueeFast: 'marqueeFast 5s linear infinite', // faster scroll, 5 seconds
//       },
//     },
//   },
//   plugins: [],
// };
