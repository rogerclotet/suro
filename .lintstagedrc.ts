import type { Configuration } from "lint-staged";

export default {
  "apps/web/CHANGELOG.md": () =>
    "pnpm changelog:generate && git add apps/mobile/store/play/metadata/android apps/mobile/store.config.json",
  "*.{js,jsx,mjs,ts,tsx,json,html,css}": [() => "pnpm biome:fix"],
} satisfies Configuration;
