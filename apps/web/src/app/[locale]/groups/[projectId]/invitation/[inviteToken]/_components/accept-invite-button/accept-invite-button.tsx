"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { acceptInvite } from "./actions";

export default function AcceptInviteButton({
  projectId,
  inviteToken,
}: {
  projectId: string;
  inviteToken: string;
}) {
  const router = useRouter();
  const t = useTranslations("invitation");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      await acceptInvite(projectId, inviteToken);
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
