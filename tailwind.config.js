/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#c28f7a',
        accent: '#a56a4f',
        secondary: '#f5f1ec',
        muted: '#777',
      },
    },
  },
  plugins: [],
};