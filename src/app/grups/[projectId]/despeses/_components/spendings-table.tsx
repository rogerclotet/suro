"use client";

import type { Spending } from "@/app/_data/spending";
import { useProjects } from "@/app/_state/project-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import React from "react";
import MonetaryAmount from "./monetary-amount";
import { calculateBalances } from "./settle-button/calculate-balances";

export default function SpendingsTable({
  spendings,
}: {
  spendings: Spending[];
}) {
  const [balnaces, setBalances] = React.useState<Record<string, number>>({});
  const [currency, setCurrency] = React.useState(
    () => spendings[0]?.currency ?? "EUR",
  );
  const { project } = useProjects();

  React.useEffect(() => {
    if (!project) {
      return;
    }

    setBalances(() => calculateBalances(project, spendings));
    setCurrency(spendings[0]?.currency ?? "EUR");
  }, [spendings, project]);

  if (!project) {
    return (
      <div className="flex h-[150px] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuari</TableHead>
          <TableHead>Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {project.users.map((u) => (
          <TableRow
            key={u.user.id}
            className="hover:bg-card [&_.avatar]:transition-colors [&_.avatar]:hover:border-card"
          >
            <TableCell className="flex items-center gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={u.user.image ?? undefined} />
                <AvatarFallback>
                  {u.user.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {u.user.name}
            </TableCell>
            <TableCell>
              <MonetaryAmount
                amount={balnaces[u.user.id] ?? 0}
                currency={currency}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
