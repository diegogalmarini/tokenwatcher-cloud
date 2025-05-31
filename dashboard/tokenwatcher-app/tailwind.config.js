// dashboard/tokenwatcher-app/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    // (si tienes archivos .html u otros, agrégalos también)
  ],
  darkMode: "class", // <-- Usaremos la clase "dark" para activar el modo oscuro manualmente
  theme: {
    extend: {
      // Aquí puedes extender tu theme (colors, fonts, etc.)
    },
  },
  plugins: [],
};
