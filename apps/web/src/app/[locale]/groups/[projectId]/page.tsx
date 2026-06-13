import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const locale = await getLocale();

  redirect(
    getPathname({
      href: {
        pathname: "/groups/[projectId]/calendar",
        params: { projectId },
      },
      locale,
    }),
  );
}
