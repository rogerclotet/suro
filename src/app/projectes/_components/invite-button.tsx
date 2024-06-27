"use client";

import type { Project } from "@/app/_data/project";
import { UserPlus } from "lucide-react";
import React from "react";
import { toast } from "sonner";

export default function InviteButton({ project }: { project: Project }) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/projectes/${project.id}?token=${project.inviteToken}`
      : "";

  async function copyLinkToClipboard() {
    await navigator.clipboard.writeText(inviteLink);
    toast.info("Copiat al porta-retalls");
  }

  return (
    <>
      <button
        onClick={() => dialog.current?.showModal()}
        aria-label="Convidar"
        className="btn btn-square btn-ghost btn-sm"
      >
        <UserPlus />
      </button>

      <dialog ref={dialog} className="modal">
        <div className="modal-box">
          <h3 className="mb-4 text-lg font-semibold">Convidar usuaris</h3>

          <div className="flex flex-col gap-4">
            <p>
              Pots convidar usuaris a aquest projecte compartint el següent
              enllaç:
            </p>
            <p>
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="input input-bordered w-full"
              />
            </p>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-neutral">Tancar</button>
            </form>
            <button onClick={copyLinkToClipboard} className="btn btn-primary">
              Copiar enllaç
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
