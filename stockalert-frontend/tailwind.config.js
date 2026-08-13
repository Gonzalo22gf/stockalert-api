/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#ff7a1a",
          50: "#fff3e9",
          400: "#ff9f4d",
          500: "#ff7a1a",
          600: "#e8620a"
        },
        base: "#0a0b0f",
        panel: "#13151c",
        "panel-hover": "#1a1d26",
        "border-soft": "#1c1f29"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(-4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        }
      },
      animation: {
        rise: "rise 0.5s ease backwards",
        fade: "fade 0.6s ease",
        pop: "pop 0.18s ease-out",
        "fade-fast": "fade 0.15s ease",
        shimmer: "shimmer 1.4s infinite"
      }
    }
  },
  plugins: []
};