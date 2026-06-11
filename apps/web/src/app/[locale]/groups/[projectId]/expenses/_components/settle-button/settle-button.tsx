"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Check, Handshake } from "lucide-react";
import posthog from "posthog-js";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Spending } from "@/app/_data/spending";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import { useSession } from "@/lib/session";
import SettleProposal from "./_components/settle-proposal";
import type { SettlingPayment } from "./data";
import { generateProposals } from "./generate-proposals";

type Member = { user: { id: string; name: string | null } };

export default function SettleButton({
  spendings,
  members,
  potId,
}: {
  spendings: Spending[];
  members: Member[];
  potId: string;
}) {
  // Every proposal starts selected (matching the mobile settle sheet); only
  // the opt-outs are tracked, so the default stays "settle everything".
  const [excluded, setExcluded] = useState<ReadonlySet<number>>(new Set());
  const { data: session } = useSession();

  const pending = useMemo(
    () => generateProposals(members, spendings),
    [spendings, members],
  );

  const selected = useMemo(
    () => (pending ?? []).filter((_, index) => !excluded.has(index)),
    [pending, excluded],
  );

  function handleProposalChange(index: number, isSelected: boolean) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <>
      {pending && (
        <ModalForm
          trigger={
            <Button variant="ghost" size="sm" className="gap-2">
              <Handshake />
              Saldar
            </Button>
          }
          title="Saldar deutes"
          description="Selecciona les propostes que vulguis realitzar per saldar deutes"
        >
          <SettleButtonContent
            pending={pending}
            selected={selected}
            onProposalChange={handleProposalChange}
            members={members}
            potId={potId}
            sessionId={session?.user.id}
          />
        </ModalForm>
      )}
    </>
  );
}

function SettleButtonContent({
  pending,
  selected,
  onProposalChange,
  members,
  potId,
  sessionId,
}: {
  pending: SettlingPayment[];
  selected: SettlingPayment[];
  onProposalChange: (index: number, selected: boolean) => void;
  members: Member[];
  potId: string;
  sessionId?: string;
}) {
  const { close } = useModalForm();
  const settlePayments = useMutation(api.expenses.settlePayments);

  async function handleSubmit() {
    try {
      await settlePayments({
        potId: potId as Id<"pots">,
        payments: selected.map((p) => ({
          from: p.from as Id<"users">,
          to: p.to as Id<"users">,
          amount: p.amount,
        })),
      });
      close();
      toast.success("Deutes saldats correctament");
    } catch (e) {
      posthog.captureException(e, {
        distinctId: sessionId,
        action: "settle_payments",
        potId,
      });
      toast.error("Error al saldar deutes");
    }
  }

  return (
    <>
      {pending.length === 0 ? (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>{"Ja s'han saldat tots els pagaments"}</AlertTitle>
          <AlertDescription>
            No hi ha cap deute pendent a saldar.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="mb-2 space-y-2">
          <h2 className="font-semibold">Propostes per saldar deutes:</h2>
          <ul className="space-y-2">
            {pending.map((payment, index) => (
              <li key={`${payment.from}-${payment.to}-${payment.amount}`}>
                <SettleProposal
                  payment={payment}
                  members={members}
                  onChange={(selected) => onProposalChange(index, selected)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {pending.length > 0 && (
        <Button
          disabled={pending.length === 0}
          onClick={handleSubmit}
          className="w-full"
        >
          Confirmar seleccionades
        </Button>
      )}
    </>
  );
}
