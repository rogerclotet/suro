import { auth } from "@/auth";
import Login from "./_components/login";

export default async function LoginPage() {
  const session = await auth();
  const previewEmail = process.env.PREVIEW_AUTH_EMAIL || undefined;
  return <Login session={session} previewEmail={previewEmail} />;
}
