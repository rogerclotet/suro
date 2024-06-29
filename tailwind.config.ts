import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        dark: {
          primary: "#9FE88D",
          secondary: "#2D82B7",
          accent: "#EF946C",
          neutral: "#FFFFFF",
          "base-100": "#2A303C",
        },
        light: {
          primary: "#40634C",
          secondary: "#2D82B7",
          accent: "#EF946C",
          neutral: "#2A303C",
          "base-100": "#FFFFFF",
        },
      },
    ],
  },
} satisfies Config;
