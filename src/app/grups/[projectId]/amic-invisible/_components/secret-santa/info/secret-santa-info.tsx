"use client";

import type { SecretSanta } from "@/app/_data/secret-santa";
import { useProjects } from "@/app/_state/project-state";
import SettingsMenu from "../settings/menu";
import TimeInfo from "./time-info";

export default function SecretSantaInfo({
  secretSanta,
}: {
  secretSanta: SecretSanta;
}) {
  const { name, description, datetime, priceRange } = secretSanta;
  const { isAdmin } = useProjects();

  const hasMinimumPrice = priceRange.min > 0;
  const hasPriceRange = priceRange.max > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-2xl">{name}</h2>

        {isAdmin && <SettingsMenu secretSanta={secretSanta} />}
      </div>

      <p className="text-foreground/80">{description}</p>

      <p className="h-6 text-muted-foreground text-sm">
        <TimeInfo datetime={datetime} />
      </p>

      {hasPriceRange && (
        <p className="text-muted-foreground text-sm">
          <span>Valor orientatiu per persona: </span>
          <span>
            {hasMinimumPrice
              ? `${priceRange.min}€ - ${priceRange.max}€`
              : `${priceRange.max}€`}
          </span>
        </p>
      )}
    </div>
  );
}
