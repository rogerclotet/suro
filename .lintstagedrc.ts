// See https://nextjs.org/docs/basic-features/eslint#lint-staged for details

import type { Configuration } from "lint-staged";

export default {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "vitest related run"],
  "*.{js,jsx,mjs,ts,tsx,json,html,css}": [() => "biome check --write"],
  "*.{ts,tsx}": [() => "tsc -p tsconfig.json --noEmit"],
  ".biome.json": ["biome migrate --write"],
} satisfies Configuration;
