import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";

/**
 * The old mobile group switcher, merged into `/groups`. Kept as a redirect for
 * installed PWAs that restore it.
 */
export default async function GroupSwitcherPage() {
  const locale = await getLocale();
  redirect(getPathname({ href: "/groups", locale }));
}
