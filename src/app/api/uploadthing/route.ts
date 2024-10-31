import { withAxiom } from "next-axiom";
import { createRouteHandler } from "uploadthing/next";

import { env } from "@/env";
import { uploadFileRouter } from "./core";

const urlBase = env.UPLOADTHING_URL;

export const { GET, POST } = withAxiom(
  createRouteHandler({
    router: uploadFileRouter,
    config: {
      token: env.UPLOADTHING_TOKEN,
      callbackUrl: urlBase ? `${urlBase}/api/uploadthing` : undefined,
      logLevel: process.env.NODE_ENV === "development" ? "Debug" : "Warning",
    },
  }),
);
