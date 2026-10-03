"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  createSettlementDraft,
  selectedSettlementPayments,
  settlementPaymentKey,
  settlementProposalsMatch,
  toggleSettlementPayment,
} from "domain/expenses";
import { Check, Handshake } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import { captureException } from "@/lib/error-reporting";
import SettleProposal from "./_components/settle-proposal";
import type { SettlingPayment } from "./data";

type Member = { user: { id: string; name: string | null } };

export default function SettleButton({
  pending,
  members,
  potId,
}: {
  pending: SettlingPayment[];
  members: Member[];
  potId: string;
}) {
  const t = useTranslations("settlement");

  return (
    <>
      {pending && (
        <ModalForm
          trigger={
            <Button variant="ghost" size="sm" className="gap-2">
              <Handshake />
              {t("title")}
            </Button>
          }
          title={t("title")}
          description={t("description")}
        >
          <SettleButtonContent
            key={potId}
            pending={pending}
            members={members}
            potId={potId}
          />
        </ModalForm>
      )}
    </>
  );
}

function SettleButtonContent({
  pending,
  members,
  potId,
}: {
  pending: SettlingPayment[];
  members: Member[];
  potId: string;
}) {
  const { close } = useModalForm();
  const t = useTranslations("settlement");
  const [draft, setDraft] = useState(() => createSettlementDraft(pending));
  const [busy, setBusy] = useState(false);
  const [operationId, setOperationId] = useState(() => crypto.randomUUID());
  const selected = selectedSettlementPayments(draft);
  const stale = !settlementProposalsMatch(draft.reviewed, pending);
  const settlePayments = useMutation(api.expenses.settlePayments);

  async function handleSubmit() {
    if (busy || stale || selected.length === 0) return;
    setBusy(true);
    try {
      await settlePayments({
        operationId,
        reviewedPayments: draft.reviewed.map((p) => ({
          from: p.from as Id<"users">,
          to: p.to as Id<"users">,
          amount: p.amount,
        })),
        potId: potId as Id<"pots">,
        payments: selected.map((p) => ({
          from: p.from as Id<"users">,
          to: p.to as Id<"users">,
          amount: p.amount,
        })),
      });
      close();
      toast.success(t("success"));
    } catch (e) {
      captureException(e, { action: "settle_payments" });
      toast.error(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {stale && (
        <Alert>
          <AlertDescription>{t("changed")}</AlertDescription>
          <Button
            disabled={busy}
            onClick={() => {
              setDraft(createSettlementDraft(pending));
              setOperationId(crypto.randomUUID());
            }}
          >
            {t("review")}
          </Button>
        </Alert>
      )}
      {draft.reviewed.length === 0 ? (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>{t("allSettled")}</AlertTitle>
          <AlertDescription>{t("noPayments")}</AlertDescription>
        </Alert>
      ) : (
        <div className="mb-2 space-y-2">
          <h2 className="font-semibold">{t("proposals")}</h2>
          <ul className="space-y-2">
            {draft.reviewed.map((payment) => (
              <li key={settlementPaymentKey(payment)}>
                <SettleProposal
                  payment={payment}
                  members={members}
                  checked={draft.selectedKeys.has(
                    settlementPaymentKey(payment),
                  )}
                  disabled={busy || stale}
                  onChange={() => {
                    setDraft(toggleSettlementPayment(draft, payment));
                    setOperationId(crypto.randomUUID());
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {draft.reviewed.length > 0 && (
        <Button
          disabled={busy || stale || selected.length === 0}
          onClick={handleSubmit}
          className="w-full"
        >
          {t("confirm")}
        </Button>
      )}
    </>
  );
}
