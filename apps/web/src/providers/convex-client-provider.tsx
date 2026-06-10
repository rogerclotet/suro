"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

// biome-ignore lint/style/noNonNullAssertion: validated in env.js; missing it is a boot-time misconfig.
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Client-side Convex provider with Convex Auth wiring. Pairs with
 * `ConvexAuthNextjsServerProvider` in the root layout, which reads the auth
 * token from cookies on the server. Replaces the NextAuth `SessionProvider`.
 */
export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
