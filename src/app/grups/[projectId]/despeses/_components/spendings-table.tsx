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
import { calculateBalances } from "./settle-button/calculate-balances";
import UserBalance from "./user-balance";

export default function SpendingsTable({
  spendings,
}: {
  spendings: Spending[];
}) {
  const [balances, setBalances] = React.useState<Record<string, number>>({});
  const [currency, setCurrency] = React.useState(
    () => spendings[0]?.currency ?? "EUR",
  );
  const [maxAbsBalance, setMaxAbsBalance] = React.useState(0);
  const { project } = useProjects();

  React.useEffect(() => {
    if (!project) {
      return;
    }

    const balances = calculateBalances(project, spendings);
    setBalances(balances);
    setMaxAbsBalance(
      Math.max(
        ...Object.values(balances).map((balance) =>
          Math.abs(Math.round(balance)),
        ),
      ),
    );
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
    <Table className="mx-auto max-w-2xl">
      <TableHeader>
        <TableRow>
          <TableHead>Usuari</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
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
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {u.user.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {u.user.name}
            </TableCell>
            <TableCell className="p-0 pr-4">
              <UserBalance
                balance={balances[u.user.id] ?? 0}
                maxAbsBalance={maxAbsBalance}
                currency={currency}
                className="ml-auto"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
