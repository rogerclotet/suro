import { withAxiom } from "next-axiom";
import { handlers } from "@/auth";

export const { GET, POST } = withAxiom(handlers);
