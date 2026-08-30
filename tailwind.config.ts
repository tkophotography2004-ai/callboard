import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#09080a",
          900: "#100e12",
          800: "#1a161c",
          700: "#2a232c",
        },
        copper: {
          200: "#f0d0b4",
          300: "#e0b088",
          400: "#c47a4a",
          500: "#a85f32",
        },
        paper: "#f3ead8",
        mist: "#c8c0b4",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        copper: "0 0 40px rgba(196, 122, 74, 0.18)",
      },
      backgroundImage: {
        "hero-fade":
          "linear-gradient(180deg, rgba(9,8,10,0.15) 0%, rgba(9,8,10,0.55) 48%, rgba(9,8,10,0.97) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
