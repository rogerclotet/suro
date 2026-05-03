"use client";

import { Copy, Share2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { RWebShare } from "react-web-share";
import { toast } from "sonner";
import type { Project } from "@/app/_data/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModalForm from "@/components/ui/modal-form";

export default function InviteButton({ project }: { project: Project }) {
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/groups/${project.id}/invitation/${project.inviteToken}`
      : "";

  async function copyLinkToClipboard() {
    await navigator.clipboard.writeText(inviteLink);
    toast.info(tCommon("copiedToClipboard"));
  }

  const canShare = !!navigator.canShare;

  return (
    <ModalForm
      trigger={
        <Button variant="ghost" size="icon" aria-label={t("invite")}>
          <UserPlus />
        </Button>
      }
      title={t("inviteTitle")}
      description={t("inviteDescription")}
    >
      <div className="space-y-2">
        <Input readOnly value={inviteLink} />
        <Button
          variant={canShare ? "ghost" : "default"}
          onClick={copyLinkToClipboard}
          className="flex w-full items-center gap-2"
        >
          <Copy />
          {t("copyLink")}
        </Button>
        {canShare && (
          <Button aria-label={t("share")} className="w-full">
            <RWebShare
              data={{
                title: project.name,
                text: t("joinShareText", {
                  names: project.users.map((u) => u.user.name).join(", "),
                }),
                url: inviteLink,
              }}
              closeText={tCommon("close")}
            >
              <span className="flex items-center gap-2">
                <Share2 /> {t("share")}
              </span>
            </RWebShare>
          </Button>
        )}
      </div>
    </ModalForm>
  );
}
