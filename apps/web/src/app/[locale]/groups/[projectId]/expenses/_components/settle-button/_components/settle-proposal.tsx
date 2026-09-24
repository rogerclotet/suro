"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import MonetaryAmount from "../../monetary-amount";
import type { SettlingPayment } from "../data";

type Member = { user: { id: string; name: string | null } };

export default function SettleProposal({
  payment,
  members,
  onChange,
  checked,
  disabled,
}: {
  payment: SettlingPayment;
  members: Member[];
  onChange: (selected: boolean) => void;
  checked: boolean;
  disabled: boolean;
}) {
  const t = useTranslations("settlement");
  const checkboxId = `settle-${payment.from}-${payment.to}-${payment.amount}`;

  return (
    <label className="cursor-pointer" htmlFor={checkboxId}>
      <Card
        className={cn(
          "flex flex-row items-center gap-4 border-2 border-transparent px-4 py-1",
          checked && "border-primary",
        )}
      >
        <Checkbox
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(checked) => {
            if (checked === "indeterminate") {
              return;
            }
            onChange(checked);
          }}
        />

        <div className="flex flex-col">
          <div className="flex flex-row flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">
              {getUserName(payment.from, members, t("someone"))}
            </span>
            <ArrowRight className="h-4 w-4" />{" "}
            <span className="font-semibold text-foreground">
              {getUserName(payment.to, members, t("someone"))}
            </span>
          </div>
          <MonetaryAmount amount={payment.amount} currency={payment.currency} />
        </div>
      </Card>
    </label>
  );
}

function getUserName(userId: string, members: Member[], fallback: string) {
  return members.find((u) => u.user.id === userId)?.user.name ?? fallback;
}
