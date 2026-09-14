import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./legacy/**/*.html", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { navy: "#102A52", teal: "#08786E", gold: "#F5B91D", cream: "#FAF9F4", muted: "#5E738F" },
      boxShadow: { soft: "0 20px 55px rgba(16,42,82,.10)", card: "0 18px 45px rgba(16,42,82,.12)" },
    },
  },
  plugins: [],
};

export default config;
