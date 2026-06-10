import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buildLoginRedirect } from "@/lib/auth-redirect";
import { pathnameHeader } from "@/proxy";

export async function checkAuth() {
  const headersList = await headers();
  const redirectTo = headersList.get(pathnameHeader);

  const session = await auth();
  if (!session) {
    return redirect(buildLoginRedirect(redirectTo));
  }
}
