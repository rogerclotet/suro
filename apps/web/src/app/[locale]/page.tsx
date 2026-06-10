import Redirect from "@/app/_components/redirect";
import { auth } from "@/auth";
import Landing from "./_components/landing";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    return <Landing />;
  }

  return <Redirect />;
}
