export { proxy as middleware } from "./proxy";

export const config = {
  matcher: ["/((?!_next|_vercel|ingest|.*\\..*).*)"],
};
