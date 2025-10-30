"use client";

import { ArrowRight } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import MonetaryAmount from "../../monetary-amount";
import type { SettlingPayment } from "../data";

export default function SettleProposal({
  payment,
  onChange,
}: {
  payment: SettlingPayment;
  onChange: (selected: boolean) => void;
}) {
  const [checked, setChecked] = useState(false);
  const { project } = useProjects();
  const checkboxId = `settle-${payment.from}-${payment.to}-${payment.amount}`;

  if (!project) {
    return null;
  }

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
          defaultChecked={false}
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
              {getUserName(payment.from, project)}
            </span>
            <ArrowRight className="h-4 w-4" />{" "}
            <span className="font-semibold text-foreground">
              {getUserName(payment.to, project)}
            </span>
          </div>
          <MonetaryAmount amount={payment.amount} currency={payment.currency} />
        </div>
      </Card>
    </label>
  );
}

function getUserName(userId: string, project: Project) {
  return (
    project.users.find((u) => u.user.id === userId)?.user.name ?? "Desconegut"
  );
}
