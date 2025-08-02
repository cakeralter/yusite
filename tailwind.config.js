/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007aff',
        secondary: '#34c759',
        danger: '#ff3b30',
        warning: '#ff9500',
        dark: '#1d1d1f',
        gray: {
          100: '#f5f5f7',
          200: '#d2d2d7',
          300: '#86868b',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}