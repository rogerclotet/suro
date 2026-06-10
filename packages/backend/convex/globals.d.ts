// Ambient globals shared by both tsconfigs (the package tsconfig.json and the
// Convex-managed convex/tsconfig.json), so they agree without pulling in
// @types/node (whose full API isn't available in the Convex runtime).

// Convex functions read deployment env vars via process.env.
declare const process: { env: Record<string, string | undefined> };

// Vite's import.meta.glob, used by convex-test to load function modules.
interface ImportMeta {
  glob: (
    pattern: string | string[],
    options?: Record<string, unknown>,
  ) => Record<string, () => Promise<Record<string, unknown>>>;
}
