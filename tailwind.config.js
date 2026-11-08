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
        apple: {
          bg: '#FBFBFD',
          darkBg: '#000000',
          card: '#FFFFFF',
          darkCard: '#1C1C1E',
          elevated: '#F5F5F7',
          darkElevated: '#2C2C2E',
          border: 'rgba(0, 0, 0, 0.08)',
          darkBorder: 'rgba(255, 255, 255, 0.12)',
          blue: '#0071E3',
          darkBlue: '#2997FF',
          indigo: '#5E5CE6',
          amber: '#B25E00',
          darkAmber: '#FF9F0A',
          green: '#248A3D',
          darkGreen: '#30D158',
          red: '#D70015',
          darkRed: '#FF453A'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Inter"',
          '"Hiragino Sans"',
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          'sans-serif'
        ]
      }
    },
  },
  plugins: [],
}
