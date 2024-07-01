import { auth } from "@/auth";
import { pathnameHeader } from "@/middleware";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function checkAuth() {
  const headersList = headers();
  const fullUrl = headersList.get(pathnameHeader) ?? "";

  const session = await auth();
  if (!session) {
    return redirect(fullUrl ? `/login?to=${fullUrl}` : "/login");
  }
}
