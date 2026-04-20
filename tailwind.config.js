/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
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
