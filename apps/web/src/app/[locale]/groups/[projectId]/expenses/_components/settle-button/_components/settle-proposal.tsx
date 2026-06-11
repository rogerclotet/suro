"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
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
}: {
  payment: SettlingPayment;
  members: Member[];
  onChange: (selected: boolean) => void;
}) {
  // Proposals start selected, like the mobile settle sheet.
  const [checked, setChecked] = useState(true);
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
          onCheckedChange={(checked) => {
            if (checked === "indeterminate") {
              return;
            }
            setChecked(checked);
            onChange(checked);
          }}
        />

        <div className="flex flex-col">
          <div className="flex flex-row flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">
              {getUserName(payment.from, members)}
            </span>
            <ArrowRight className="h-4 w-4" />{" "}
            <span className="font-semibold text-foreground">
              {getUserName(payment.to, members)}
            </span>
          </div>
          <MonetaryAmount amount={payment.amount} currency={payment.currency} />
        </div>
      </Card>
    </label>
  );
}

function getUserName(userId: string, members: Member[]) {
  return members.find((u) => u.user.id === userId)?.user.name ?? "Desconegut";
}
