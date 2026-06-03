import { createRouteHandler } from "uploadthing/next";

import { env } from "@/env";
import { uploadFileRouter } from "./core";

const urlBase = env.UPLOADTHING_URL;

export const { GET, POST } = createRouteHandler({
  router: uploadFileRouter,
  config: {
    token: env.UPLOADTHING_TOKEN,
    callbackUrl: urlBase ? `${urlBase}/api/uploadthing` : undefined,
  },
});
