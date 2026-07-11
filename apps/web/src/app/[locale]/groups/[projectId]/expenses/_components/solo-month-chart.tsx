"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export default function SoloMonthChart({
  amounts,
  monthOffset = 0,
  className,
}: {
  amounts: number[];
  monthOffset?: number;
  className?: string;
}) {
  const t = useTranslations("expenses");
  const locale = useLocale();

  const chartConfig = useMemo(
    () =>
      ({
        amount: {
          label: t("amount"),
          color: "var(--chart-1)",
        },
      }) satisfies ChartConfig,
    [t],
  );

  const monthAnchor = useMemo(() => {
    const anchor = new Date();
    anchor.setDate(1);
    anchor.setHours(0, 0, 0, 0);
    anchor.setMonth(anchor.getMonth() + monthOffset);
    return anchor;
  }, [monthOffset]);

  const data = useMemo(
    () =>
      amounts.map((amount, index) => ({
        day: index + 1,
        amount: amount / 100,
      })),
    [amounts],
  );

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("aspect-auto h-[4.5rem] w-full", className)}
      initialDimension={{ width: 320, height: 72 }}
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, items) => {
                const day = items?.[0]?.payload?.day;
                if (typeof day !== "number") {
                  return null;
                }
                return new Date(
                  monthAnchor.getFullYear(),
                  monthAnchor.getMonth(),
                  day,
                ).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                });
              }}
              formatter={(value) =>
                typeof value === "number" ? `${value.toFixed(2)}€` : value
              }
            />
          }
        />
        <Bar
          dataKey="amount"
          fill="var(--color-amount)"
          radius={[2, 2, 0, 0]}
          maxBarSize={8}
        />
      </BarChart>
    </ChartContainer>
  );
}
