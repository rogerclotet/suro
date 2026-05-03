import { auth } from "@/auth";
import Login from "./_components/login";

export default async function LoginPage() {
  const session = await auth();

  return <Login session={session} />;
}
