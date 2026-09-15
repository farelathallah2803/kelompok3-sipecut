import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        bi: {
          navy: "#0A2540",
          blue: "#00529B",
          lightBlue: "#EBF3FB",
          gold: "#D4AF37",
          accent: "#0070BA",
          dark: "#0F172A",
          surface: "#F8FAFC"
        }
      }
    },
  },
  plugins: [],
};
export default config;
