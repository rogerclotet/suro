import { withAxiom } from "next-axiom";
import { createRouteHandler } from "uploadthing/next";

import { uploadFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = withAxiom(
  createRouteHandler({
    router: uploadFileRouter,

    // Apply an (optional) custom config:
    // config: { ... },
  }),
);
