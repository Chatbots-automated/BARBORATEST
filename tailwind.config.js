/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4A5859',
        'primary-dark': '#3A4445',
        'bg-cream': '#F5F2EA',
      },
    },
  },
  plugins: [],
};