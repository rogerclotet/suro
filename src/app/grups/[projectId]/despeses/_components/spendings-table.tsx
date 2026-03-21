"use client";

import { useMemo } from "react";
import type { Spending } from "@/app/_data/spending";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateBalances } from "./settle-button/calculate-balances";
import UserBalance from "./user-balance";

type Member = {
  user: { id: string; name: string | null; image: string | null };
};

export default function SpendingsTable({
  spendings,
  members,
}: {
  spendings: Spending[];
  members: Member[];
}) {
  const { balances, currency, maxAbsBalance } = useMemo(() => {
    const balances = calculateBalances(members, spendings);
    const maxAbsBalance = Math.max(
      ...Object.values(balances).map((balance) => Math.abs(balance)),
    );
    const currency = spendings[0]?.currency ?? "EUR";

    return { balances, currency, maxAbsBalance };
  }, [spendings, members]);

  return (
    <Table className="mx-auto max-w-2xl">
      <TableHeader>
        <TableRow>
          <TableHead>Usuari</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((u) => (
          <TableRow
            key={u.user.id}
            className="hover:bg-card [&_.avatar]:transition-colors hover:[&_.avatar]:border-card"
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
