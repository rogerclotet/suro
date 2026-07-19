import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateTokensCss } from "../src/colors";

const __dirname = dirname(fileURLToPath(import.meta.url));

writeFileSync(join(__dirname, "../src/tokens.css"), generateTokensCss());
console.log("Wrote packages/design-tokens/src/tokens.css");
