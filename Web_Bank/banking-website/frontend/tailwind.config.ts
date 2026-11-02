import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A1628",
          900: "#0A1628",
          800: "#0F2138",
          700: "#16314f",
        },
        royal: {
          DEFAULT: "#1A5CFF",
          600: "#1A5CFF",
          500: "#3B73FF",
          50: "#EAF1FF",
        },
        gold: { DEFAULT: "#D4A843" },
        success: { DEFAULT: "#0EA371" },
        warning: { DEFAULT: "#F5A623" },
        danger: { DEFAULT: "#E53E3E" },
        ink: { DEFAULT: "#2D3748" },
        mist: { DEFAULT: "#F7F8FA" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
        lift: "0 10px 30px -10px rgba(10,22,40,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
