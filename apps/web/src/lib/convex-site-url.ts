/**
 * The Convex HTTP-actions origin for this deployment. Convex serves httpRouter
 * routes on `<deployment>.convex.site` (the `.convex.cloud` API host with the
 * suffix swapped).
 */
export function convexSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_CONVEX_URL ?? "").replace(
    /\.convex\.cloud$/,
    ".convex.site",
  );
}
