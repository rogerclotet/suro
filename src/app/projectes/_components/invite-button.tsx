"use client";

import type { Project } from "@/app/_data/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModalForm from "@/components/ui/modal-form";
import { Copy, Share2, UserPlus } from "lucide-react";
import React from "react";
import { RWebShare } from "react-web-share";
import { toast } from "sonner";

export default function InviteButton({ project }: { project: Project }) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/projectes/${project.id}/invitacio/${project.inviteToken}`
      : "";

  async function copyLinkToClipboard() {
    await navigator.clipboard.writeText(inviteLink);
    toast.info("Copiat al porta-retalls");
  }

  const canShare = navigator?.canShare?.();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => modalRef.current?.click()}
        aria-label="Convidar"
      >
        <UserPlus />
      </Button>

      <ModalForm
        triggerRef={modalRef}
        title="Convidar usuaris"
        description="Pots convidar usuaris a aquest projecte compartint el següent enllaç:"
      >
        <Input readOnly value={inviteLink} />
        <Button
          variant={canShare ? "ghost" : "default"}
          onClick={copyLinkToClipboard}
          className="flex items-center gap-2"
        >
          <Copy />
          Copiar enllaç
        </Button>
        {canShare && (
          <Button aria-label="Compartir">
            <RWebShare
              data={{
                title: project.name,
                text: `Uneix-te a ${project.users.map((u) => u.user.name).join(", ")}`,
                url: inviteLink,
              }}
              closeText="Tancar"
            >
              <span className="flex items-center gap-2">
                <Share2 /> Compartir
              </span>
            </RWebShare>
          </Button>
        )}
      </ModalForm>
    </>
  );
}
