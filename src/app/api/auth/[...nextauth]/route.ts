import { handlers } from "@/auth";
import { withAxiom } from "next-axiom";

export const { GET, POST } = withAxiom(handlers);
