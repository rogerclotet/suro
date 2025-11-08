import { redirect } from "next/navigation";
import { getFlags } from "@/server/flags";

export default async function AmicInvisiblePage() {
  const flags = await getFlags();
  if (!flags.amicInvisible) {
    redirect("/");
  }

  return <div>AmicInvisiblePage</div>;
}
