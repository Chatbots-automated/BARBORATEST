/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#8B8455',
        'primary-dark': '#726D46',
        'bg-cream': '#F5F2EA',
      },
    },
  },
  plugins: [],
};