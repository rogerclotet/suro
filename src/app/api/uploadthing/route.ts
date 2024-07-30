import { withAxiom } from "next-axiom";
import { createRouteHandler } from "uploadthing/next";

import { env } from "@/env";
import { uploadFileRouter } from "./core";

const urlBase = env.UPLOADTHING_URL;

// Export routes for Next App Router
export const { GET, POST } = withAxiom(
  createRouteHandler({
    router: uploadFileRouter,
    config: {
      uploadthingId: env.UPLOADTHING_APP_ID,
      uploadthingSecret: env.UPLOADTHING_SECRET,
      callbackUrl: urlBase ? `${urlBase}/api/uploadthing` : undefined,
    },
  }),
);
