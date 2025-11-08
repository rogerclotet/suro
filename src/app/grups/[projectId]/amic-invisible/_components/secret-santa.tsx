import { useMemo } from "react";
import type { SecretSanta as SecretSantaType } from "@/app/_data/secret-santa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SecretSanta({
  secretSanta: { name, description, datetime, priceRange, participants },
}: {
  secretSanta: SecretSantaType;
}) {
  const daysToStart = useMemo(() => {
    const now = new Date();
    const diffTime = datetime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          {daysToStart > 0
            ? ` - Falten ${daysToStart} dies!`
            : daysToStart === 1 && " - Falta 1 dia!"}
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

      <div className="flex flex-row flex-wrap gap-4">
        {participants.map((participant) => {
          return (
            <Card key={participant.id} className="w-32">
              <CardHeader>
                <CardDescription className="flex flex-col items-center gap-2">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {participant.user.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                    <AvatarImage src={participant.user.image ?? undefined} />
                  </Avatar>
                  <p className="text-center">{participant.user.name}</p>
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
