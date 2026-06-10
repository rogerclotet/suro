/**
 * Universal Link / App Link entry point for the router. expo-router calls
 * redirectSystemPath for every incoming link (cold start and while running)
 * before resolving a route; we delegate to webPathToRoute, which maps localized
 * group web URLs to in-app routes and passes everything else through.
 *
 * The logic lives in src/lib/group-paths so it stays out of the route directory
 * — expo-router's require.context over src/app would otherwise bundle a
 * colocated *.test.ts (and its vitest/vite imports) into the app — and so it can
 * be unit-tested there.
 */
import { webPathToRoute } from "../lib/group-paths";

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  return webPathToRoute(path);
}
