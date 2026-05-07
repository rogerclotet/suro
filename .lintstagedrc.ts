import type { Configuration } from "lint-staged";

export default {
  "*.{js,jsx,ts,tsx}": ["vitest related run"],
  "*.{js,jsx,mjs,ts,tsx,json,html,css}": [() => "pnpm biome:fix"],
  "*.{ts,tsx}": [() => "tsc -p tsconfig.json --noEmit"],
  ".biome.json": ["biome migrate --write"],
} satisfies Configuration;
