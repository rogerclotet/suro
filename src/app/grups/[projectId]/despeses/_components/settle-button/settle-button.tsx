"use client";

import { captureException } from "@sentry/nextjs";
import { Check, Handshake } from "lucide-react";
import { useLogger } from "next-axiom";
import React from "react";
import { toast } from "sonner";
import type { Spending } from "@/app/_data/spending";
import { useProjects } from "@/app/_state/project-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ModalForm from "@/components/ui/modal-form";
import SettleProposal from "./_components/settle-proposal";
import { settlePayments } from "./actions";
import type { SettlingPayment } from "./data";
import { generateProposals } from "./generate-proposals";

export default function SettleButton({ spendings }: { spendings: Spending[] }) {
  const [pending, setPending] = React.useState<SettlingPayment[]>();
  const [selected, setSelected] = React.useState<SettlingPayment[]>([]);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const { project } = useProjects();
  const log = useLogger();

  React.useEffect(() => {
    if (!project) {
      return;
    }
    setPending(generateProposals(project, spendings));
    setSelected([]);
  }, [spendings, project]);

  function handleProposalChange(index: number, selected: boolean) {
    const payment = pending?.[index];
    if (payment === undefined) {
      return;
    }

    if (selected) {
      setSelected((prev) => [...prev, payment]);
    } else {
      setSelected((prev) => prev.filter((p) => p !== payment));
    }
  }

  async function handleSubmit() {
    try {
      await settlePayments(project!.id, selected);
      triggerRef.current?.click();
      toast.success("Deutes saldats correctament");
    } catch (e) {
      captureException(e);
      log.error("Error settling payments", {
        error: e,
        payments: selected,
        projectId: project!.id,
      });
      toast.error("Error al saldar deutes");
    }
  }

  return (
    <>
      <Button
        variant="neutral"
        size="sm"
        onClick={() => triggerRef.current?.click()}
        className="gap-2"
      >
        <Handshake />
        Saldar
      </Button>

      {pending !== undefined && (
        <ModalForm
          triggerRef={triggerRef}
          title="Saldar deutes"
          description="Selecciona les propostes que vulguis realitzar per saldar deutes"
        >
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
                  <li key={index}>
                    <SettleProposal
                      payment={payment}
                      onChange={(selected) =>
                        handleProposalChange(index, selected)
                      }
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
        </ModalForm>
      )}
    </>
  );
}
