export default {
  providers: [
    {
      // Convex validates Convex Auth's JWTs against this deployment's own issuer.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
