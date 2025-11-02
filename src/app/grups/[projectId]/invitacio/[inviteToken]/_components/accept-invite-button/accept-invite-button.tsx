"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "./actions";

export default function AcceptInviteButton({
  projectId,
  inviteToken,
}: {
  projectId: string;
  inviteToken: string;
}) {
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      await acceptInvite(projectId, inviteToken);
      toast.success("Has entrat al grup");
      router.push(`/grups/${projectId}`);
    } catch (e) {
      toast.error(`No has pogut entrar al grup: ${e}`);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit">Acceptar invitació</Button>
    </form>
  );
}
