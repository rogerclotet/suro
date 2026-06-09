"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export default function AcceptInviteButton({
  projectId,
  inviteToken,
}: {
  projectId: string;
  inviteToken: string;
}) {
  const router = useRouter();
  const t = useTranslations("invitation");
  const acceptInvite = useMutation(api.projects.acceptInvite);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      await acceptInvite({
        projectId: projectId as Id<"projects">,
        inviteToken,
      });
      toast.success(t("acceptSuccess"));
      router.push({ pathname: "/groups/[projectId]", params: { projectId } });
    } catch (e) {
      toast.error(`${t("acceptError")}: ${e}`);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit">{t("accept")}</Button>
    </form>
  );
}
