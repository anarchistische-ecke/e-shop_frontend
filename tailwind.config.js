/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b65b4a',
        accent: '#2f3d32',
        secondary: '#f4efe7',
        muted: '#6f6a62',
        ink: '#2b2722',
        sand: '#e7ddce',
        blush: '#f1e6dc',
        sky: '#d9e5df',
      },
    },
  },
  plugins: [],
};
