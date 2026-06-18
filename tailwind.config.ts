import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0B",
        surface: {
          DEFAULT: "#141415",
          raised:  "#1B1B1D",
          hover:   "#222225",
        },
        ink: "#F5F4F2",
        muted: {
          DEFAULT: "#B4AFA8",
          dim:     "#8B857D",
        },
        accent: {
          DEFAULT: "#F5A524",
          hi:      "#FFBE4D",
        },
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%,100%": { opacity: "0.3" },
          "50%":      { opacity: "0.7" },
        },
        ripple: {
          "0%":   { transform: "scale(1)",   opacity: "0.6" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
      },
      animation: {
        fadeUp:  "fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        fadeIn:  "fadeIn 0.3s ease-out forwards",
        scaleIn: "scaleIn 0.25s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        glow:    "glow 3s ease-in-out infinite",
        ripple:  "ripple 1s ease-out infinite",
        spin:    "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
