"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { adaptSpending } from "@/app/_data/spending";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  monthDailyAmounts,
  monthSpendingTotal,
} from "@/lib/expenses/month-totals";
import { useSoloExpenses } from "@/lib/queries/use-expenses";
import CreateSoloSpendingButton from "./create-solo-spending-button/create-solo-spending-button";
import MonetaryAmount from "./monetary-amount";
import SoloMonthChart from "./solo-month-chart";
import SoloSpendingLine from "./solo-spending-line";

export default function SoloExpensesView({ projectId }: { projectId: string }) {
  const t = useTranslations("expenses");
  const locale = useLocale();
  const solo = useSoloExpenses(projectId);
  const ensureSoloPot = useMutation(api.expenses.ensureSoloPot);

  useEffect(() => {
    void ensureSoloPot({ projectId: projectId as Id<"projects"> });
  }, [ensureSoloPot, projectId]);

  const spendings = useMemo(
    () => solo?.spendings.map(adaptSpending) ?? [],
    [solo?.spendings],
  );

  const thisMonthTotal = useMemo(
    () => monthSpendingTotal(spendings, 0),
    [spendings],
  );
  const lastMonthTotal = useMemo(
    () => monthSpendingTotal(spendings, -1),
    [spendings],
  );
  const thisMonthDaily = useMemo(
    () => monthDailyAmounts(spendings, 0),
    [spendings],
  );
  const lastMonthDaily = useMemo(
    () => monthDailyAmounts(spendings, -1),
    [spendings],
  );

  const thisMonthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }, [locale]);

  const lastMonthLabel = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }, [locale]);

  if (solo === undefined || solo === null) {
    return null;
  }

  const potId = solo.potId;
  const memberId = solo.memberId;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("soloThisMonth")}</CardDescription>
            <CardTitle className="font-medium text-base text-muted-foreground">
              {thisMonthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonetaryAmount
              amount={thisMonthTotal}
              currency="EUR"
              className="font-semibold text-3xl tabular-nums"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("soloLastMonth")}</CardDescription>
            <CardTitle className="font-medium text-base text-muted-foreground">
              {lastMonthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonetaryAmount
              amount={lastMonthTotal}
              currency="EUR"
              className="font-semibold text-3xl tabular-nums"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("soloThisMonth")}</CardDescription>
            <CardTitle className="font-medium text-base text-muted-foreground">
              {thisMonthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SoloMonthChart
              amounts={thisMonthDaily}
              className="h-[4.5rem] w-full"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("soloLastMonth")}</CardDescription>
            <CardTitle className="font-medium text-base text-muted-foreground">
              {lastMonthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SoloMonthChart
              amounts={lastMonthDaily}
              className="h-[4.5rem] w-full"
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold text-lg">{t("soloRecentSpendings")}</h2>
          {potId !== null ? (
            <CreateSoloSpendingButton potId={potId} memberId={memberId} />
          ) : null}
        </div>

        {spendings.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            {t("soloNoSpendings")}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {spendings.map((spending) => (
              <SoloSpendingLine key={spending.id} spending={spending} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
