/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0e1621',
        primary: {
          DEFAULT: '#2481cc',
          hover: '#1e6cb0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(0, 0, 0, 0.04)',
        'elevated': '0 8px 30px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
