import type { Configuration } from "lint-staged";

export default {
  "*.{js,jsx,mjs,ts,tsx,json,html,css}": [() => "pnpm biome:fix"],
} satisfies Configuration;
