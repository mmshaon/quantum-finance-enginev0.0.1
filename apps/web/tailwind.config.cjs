/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.css",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cyanGlow: "#00e5ff",
        cyanDeep: "#0084a8"
      },
      borderColor: {
        cyanGlow: "#00e5ff"
      }
    }
  },
  plugins: []
};
