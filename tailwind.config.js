/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
        display: ['Lora', 'Georgia', 'serif'],
      },
      colors: {
        primary: '#284739',
        accent: '#1d382c',
        secondary: '#f3f0e8',
        muted: '#5e6158',
        ink: '#262b25',
        sand: '#e5dfd3',
        blush: '#f4e7e1',
        sky: '#e4ebe3',
        canvas: '#faf8f3',
        line: '#deddd3',
        sale: '#994732',
      },
    },
  },
  plugins: [],
};
