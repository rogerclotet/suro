"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { calculateBalances } from "@/app/[locale]/groups/[projectId]/expenses/_components/settle-button/calculate-balances";
import UserBalance from "@/app/[locale]/groups/[projectId]/expenses/_components/user-balance";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserAvatar from "@/components/user-avatar";
import {
  buildDemoSpendings,
  demoMembers,
  demoSpendingMembers,
} from "../_data/mock";

export default function ExpensesDemo() {
  const t = useTranslations("info");

  const spendings = useMemo(() => {
    const [marta, joan, laia, pau] = demoMembers;
    if (!marta || !joan || !laia || !pau) return [];
    return buildDemoSpendings([
      {
        id: "s-1",
        amount: 18400,
        currency: "EUR",
        description: t("demoExpensesDescriptionRental"),
        payer: marta,
      },
      {
        id: "s-2",
        amount: 4280,
        currency: "EUR",
        description: t("demoExpensesDescriptionGroceries"),
        payer: joan,
      },
      {
        id: "s-3",
        amount: 6500,
        currency: "EUR",
        description: t("demoExpensesDescriptionDinner"),
        payer: laia,
      },
      {
        id: "s-4",
        amount: 1850,
        currency: "EUR",
        description: t("demoExpensesDescriptionTaxi"),
        payer: pau,
      },
    ]);
  }, [t]);

  const { balances, currency, maxAbsBalance } = useMemo(() => {
    const balances = calculateBalances(demoSpendingMembers, spendings);
    const maxAbsBalance = Math.max(
      ...Object.values(balances).map((b) => Math.abs(b)),
    );
    const currency = spendings[0]?.currency ?? "EUR";
    return { balances, currency, maxAbsBalance };
  }, [spendings]);

  return (
    <Card className="overflow-hidden px-2 py-4">
      <Table className="mx-auto max-w-2xl">
        <TableHeader>
          <TableRow>
            <TableHead>{t("demoExpensesUser")}</TableHead>
            <TableHead className="text-right">
              {t("demoExpensesBalance")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demoSpendingMembers.map((m) => (
            <TableRow key={m.user.id}>
              <TableCell className="flex items-center gap-4">
                <UserAvatar user={m.user} />
                {m.user.name}
              </TableCell>
              <TableCell className="p-0 pr-4">
                <UserBalance
                  balance={balances[m.user.id] ?? 0}
                  maxAbsBalance={maxAbsBalance}
                  currency={currency}
                  className="ml-auto"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
