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
          navy: "#0B2D5B",
          regulatory: "#1E5DA8",
          blue: "#1E5DA8",
          lightBlue: "#7FB3E6",
          sky: "#E7F0FA",
          skyTint: "#E7F0FA",
          gold: "#D4AF6B",
          goldTint: "#F7EED9",
          dark: "#2E3A4A",
          light: "#9AA7B8",
          textDark: "#2E3A4A",
          textLight: "#9AA7B8",
          accent: "#1E5DA8",
          surface: "#F8FAFC",
        },
        // Official Bank Indonesia Blue Scale
        blue: {
          50: '#E7F0FA',   // Sky Tint
          100: '#D5E6F7',
          200: '#ABCDEE',
          300: '#7FB3E6',  // Light Blue
          400: '#4B8FD1',
          500: '#2A73BD',
          600: '#1E5DA8',  // Regulatory Blue (Primary Interactive)
          700: '#164783',
          800: '#0E3465',
          900: '#0B2D5B',  // BI Navy
          950: '#061A36',
        },
        // Official Bank Indonesia Gold Scale
        gold: {
          50: '#FDFBF7',
          100: '#F7EED9',  // Gold Tint
          200: '#EEDDB3',
          300: '#E5CC8D',
          400: '#DCBF7A',
          500: '#D4AF6B',  // BI Gold
          600: '#B8934E',
          700: '#8E7036',
          800: '#644D21',
          900: '#3D2D11',
        },
        // Official Bank Indonesia Typography & Slate Scale
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#9AA7B8',  // Text Light (#9AA7B8)
          500: '#6D7C90',
          600: '#516175',
          700: '#3E4D60',
          800: '#2E3A4A',  // Text Dark (#2E3A4A)
          900: '#2E3A4A',  // Text Dark (#2E3A4A)
          950: '#1B232D',
        }
      }
    },
  },
  plugins: [],
};
export default config;
