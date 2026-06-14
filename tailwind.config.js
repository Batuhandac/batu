/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Backgrounds — Stitch #131315 palette
        bg: '#131315',
        surface: '#1f1f21',
        card: '#2a2a2b',
        'card-top': '#343536',
        // Borders — very subtle white tint
        border: 'rgba(255,255,255,0.07)',
        'border-strong': '#44474c',
        // Primary accent — orange (Stitch secondary-container)
        orange: {
          accent: '#ff7f1c',
          light: '#ffb68b',
          glow: 'rgba(255,127,28,0.3)',
        },
        // Brand steel-blue (Stitch primary)
        primary: '#bac8dc',
        // Open-status gold (Stitch tertiary)
        gold: '#eac333',
        // Keep red for emergency medical indicators
        red: {
          sos: '#E53E3E',
          dark: '#C53030',
        },
        // Keep green for open/available
        green: {
          open: '#38A169',
          light: '#68D391',
        },
        // Text scale
        gray: {
          muted: '#8e9196',
          text: '#c4c6cc',
          label: '#e4e2e3',
        },
        white: '#e4e2e3',
      },
    },
  },
  plugins: [],
};
