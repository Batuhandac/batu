/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0D1B2A',
        surface: '#152336',
        card: '#1A2E45',
        border: '#243B55',
        red: {
          sos: '#E53E3E',
          dark: '#C53030',
        },
        green: {
          open: '#38A169',
          light: '#68D391',
        },
        gray: {
          muted: '#718096',
          text: '#A0AEC0',
          label: '#CBD5E0',
        },
        white: '#F7FAFC',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
