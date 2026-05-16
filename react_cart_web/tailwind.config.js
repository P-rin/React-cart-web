/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f8f7',
          100: '#d6ebe6',
          500: '#0f766e',
          600: '#0d5f59',
          700: '#0b4a45',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 18px 45px -24px rgba(8, 47, 73, 0.35)',
      },
    },
  },
  plugins: [],
}
