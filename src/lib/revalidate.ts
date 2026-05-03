import { revalidatePath } from "next/cache";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type GetPathnameHref = Parameters<typeof getPathname>[0]["href"];

export function revalidateLocalizedPath(href: GetPathnameHref) {
  for (const locale of routing.locales) {
    revalidatePath(getPathname({ href, locale }));
  }
}
