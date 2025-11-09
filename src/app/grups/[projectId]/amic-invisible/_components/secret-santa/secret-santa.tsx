import { useMemo } from "react";
import type { SecretSanta as SecretSantaType } from "@/app/_data/secret-santa";
import { Separator } from "@/components/ui/separator";
import Exclusions from "./exclusions/exclusions";
import Participant from "./participant";

export default function SecretSanta({
  secretSanta,
}: {
  secretSanta: SecretSantaType;
}) {
  const { name, description, datetime, priceRange, participants } = secretSanta;

  const daysToStart = useMemo(() => {
    const now = new Date();
    const diffTime = datetime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [datetime]);

  const hoursToStart = useMemo(() => {
    const now = new Date();
    const diffTime = datetime.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours;
  }, [datetime]);

  const hasMinimumPrice = priceRange.min > 0;
  const hasPriceRange = priceRange.max > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="font-semibold text-2xl">{name}</h2>

        <p className="text-foreground/80">{description}</p>

        <p className="text-muted-foreground text-sm">
          {datetime.toLocaleDateString("ca-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
          {daysToStart > 0 && " - "}
          {daysToStart === 1
            ? `Falten ${hoursToStart} hores!`
            : daysToStart > 0 && `Falten ${daysToStart} dies!`}
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

      <Separator />

      <h3 className="font-semibold text-lg">Participants</h3>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-1.5">
        {participants.map((participant) => (
          <Participant key={participant.id} user={participant.user} />
        ))}
      </div>

      {participants.length > 3 && <Exclusions secretSanta={secretSanta} />}
    </div>
  );
}
