/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        quantum: {
          cyan: '#00bcd4',
          'cyan-light': '#00e5ff',
          dark: '#002b36',
          'dark-medium': '#003f5c',
          'dark-light': '#004d6b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'quantum-gradient': 'linear-gradient(135deg, #002b36, #003f5c, #004d6b)',
        'quantum-gradient-horizontal': 'linear-gradient(90deg, #00bcd4, #00e5ff)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spark': 'spark 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        spark: {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 1 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
