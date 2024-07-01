import { checkAuth } from "@/lib/check-auth";
import Redirect from "./_components/redirect";

export default async function HomePage() {
  await checkAuth();

  return <Redirect />;
}
