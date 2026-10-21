"use client";

import { hasPriceRange, type PriceRange } from "domain/secret-santa";
import { useTranslations } from "next-intl";

/** The suggested budget, or nothing when the organizer did not set one. */
export function PriceRangeText({
  priceRange,
  showHidden = false,
}: {
  priceRange: PriceRange;
  showHidden?: boolean;
}) {
  const t = useTranslations("secretSanta");
  if (!hasPriceRange(priceRange)) {
    return showHidden ? <span>{t("notVisible")}</span> : null;
  }
  return (
    <span>
      {priceRange.min > 0
        ? t("priceRangeValue", priceRange)
        : t("priceRangeUpTo", { max: priceRange.max })}
    </span>
  );
}
