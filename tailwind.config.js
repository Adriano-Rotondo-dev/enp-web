/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,css,scss}'],
  theme: {
    extend: {
      fontFamily: {
        'danger-slanted': ['AnotherDangerSlanted', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
