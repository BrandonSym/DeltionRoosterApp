// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /(bg|text|border)-(deltionBlue|deltionOrange|grayscale)-\d{1,3}/,
    },
  ],
  theme: {
    extend: {
      colors: {
        deltionOrange: {
          DEFAULT: "#f58220",
          50: "#fef3e9",
          100: "#fde6d2",
          200: "#fbcda6",
          300: "#f9b479",
          400: "#f79b4d",
          500: "#f58220",
          600: "#c4681a",
          700: "#934e13",
          800: "#62340d",
          900: "#311a06",
        },
        deltionBlue: {
          DEFAULT: "#343469",
          50: "#ebebf0",
          100: "#d6d6e1",
          200: "#aeaec3",
          300: "#8585a5",
          350: '#ADD8E6',
          400: "#5d5d87",
          500: "#343469",
          600: "#2a2a54",
          700: "#1f1f3f",
          800: "#15152a",
          900: "#0a0a15",
        },
        grayscale: {
          50: "#f0f0f0",
          100: "#e2e2e2",
          200: "#c5c5c5",
          300: "#a7a7a7",
          400: "#8a8a8a",
          500: "#6d6d6d",
          600: "#575757",
          700: "#414141",
          800: "#2c2c2c",
          900: "#000000",
        },
      },
    },
  },
  plugins: [],
}
