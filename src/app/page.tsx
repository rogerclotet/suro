import { auth } from "@/auth";
import { redirect } from "next/navigation";
import HomeRedirect from "./_components/home-redirect";

export default async function HomePage() {
  const session = await auth();
  if (!session) {
    return redirect("/login");
  }

  return <HomeRedirect />;
}
