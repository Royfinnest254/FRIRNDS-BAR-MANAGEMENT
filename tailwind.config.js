/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#fdf8f6", // Light cream background
        foreground: "#451a03", // Dark brown for text
        header: "#7c2d12", // Dark brown for navigation
        primary: {
          DEFAULT: "#ea580c", // Orange-600 for buttons
          foreground: "#ffffff",
          hover: "#c2410c",
        },
        secondary: {
          DEFAULT: "#fff7ed", // Orange-50
          foreground: "#ea580c",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f5f5f4",
          foreground: "#78716c",
        },
        accent: {
          DEFAULT: "#fed7aa", // Orange-200
          foreground: "#431407",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#451a03",
        },
        // Custom status colors
        status: {
          low: {
            bg: "#fee2e2", // Red-100
            text: "#ef4444", // Red-500
          },
          good: {
            bg: "#dcfce7", // Green-100
            text: "#22c55e", // Green-500
          }
        }
      }
    },
  },
  plugins: [],
};
