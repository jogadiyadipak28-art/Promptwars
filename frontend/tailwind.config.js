/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:       '#7DD3FC',
          'blue-deep': '#38BDF8',
          'blue-dark': '#0EA5E9',
          green:      '#4ADE80',
          'green-deep': '#34D399',
          'green-dark': '#10B981',
          pink:       '#F472B6',
          'pink-deep': '#EC4899',
          red:        '#F87171',
          'red-deep': '#EF4444',
          dark:       '#0C1B2E',
          darker:     '#081420',
        },
        fifa: {
          blue:   '#7DD3FC',
          green:  '#4ADE80',
          pink:   '#F472B6',
          red:    '#F87171',
          dark:   '#0C1B2E',
          navy:   '#081420',
          accent: '#4ADE80',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
