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
          secondary: "#5BA8D7",
          accent: "#EF946C",
          neutral: "#1c212b",
          "base-100": "#2A303C",
        },
        light: {
          primary: "#40634C",
          secondary: "#205D83",
          accent: "#EF946C",
          neutral: "#333c4d",
          "base-100": "#FFFFFF",
        },
      },
    ],
  },
} satisfies Config;
