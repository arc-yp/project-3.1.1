/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Poppins",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
        ],
      },
      colors: {
        brand: {
          blue: {
            50: "#eef5ff",
            100: "#d9eaff",
            200: "#b9d6ff",
            300: "#8fbaff",
            400: "#5f97ff",
            500: "#3b82f6",
            600: "#2563eb",
          },
          purple: {
            50: "#f4f1ff",
            100: "#e7e1ff",
            200: "#d3c7ff",
            300: "#b6a0ff",
            400: "#9a7bff",
            500: "#8b5cf6",
          },
          green: {
            50: "#effdf6",
            100: "#d8fbe9",
            200: "#b3f6d4",
            300: "#84eab8",
            400: "#4cd29a",
            500: "#22c55e",
          },
        },
      },
    },
  },
  plugins: [],
};
