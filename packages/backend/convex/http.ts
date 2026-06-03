import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Registers the Convex Auth HTTP routes (OAuth callbacks, magic-link verify).
auth.addHttpRoutes(http);

export default http;
