/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // habilita dark mode por clase
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0066FF", /* Azul principal */
          light: "#3388FF",
          dark: "#004BCC",
        },
        accent: {
          DEFAULT: "#00D272",
          hover: "#00BD63",
        },
        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Fira Code", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
