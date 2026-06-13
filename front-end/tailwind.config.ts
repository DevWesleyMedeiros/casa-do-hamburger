// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          amber: "#F2DAAC",
          red: "#C41E00",
          redVariation: "#C92A0E",
          buttonHover: "#a82209",
          dark: "#161410",
        },
      },
    },
  },
  plugins: [],
};
export default config;
