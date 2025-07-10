/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#374151',
        }
      },
      animation: {
        'spin': 'spin 1s linear infinite',
      }
    },
  },
  plugins: [],
};