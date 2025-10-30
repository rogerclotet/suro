import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { pathnameHeader } from "@/proxy";

export async function checkAuth() {
  const headersList = await headers();
  const fullUrl = headersList.get(pathnameHeader) ?? "";

  const session = await auth();
  if (!session) {
    return redirect(fullUrl ? `/login?to=${fullUrl}` : "/login");
  }
}
