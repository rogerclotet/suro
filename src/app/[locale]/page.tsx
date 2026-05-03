import Redirect from "@/app/_components/redirect";
import { checkAuth } from "@/lib/check-auth";

export default async function HomePage() {
  await checkAuth();

  return <Redirect />;
}
