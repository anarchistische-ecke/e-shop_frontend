/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b07c63',
        accent: '#6f7f76',
        secondary: '#f6f1eb',
        muted: '#6f6a64',
        ink: '#2c2622',
        sand: '#eadfd3',
        blush: '#f1e6dd',
        sky: '#d7e2dd',
      },
    },
  },
  plugins: [],
};
