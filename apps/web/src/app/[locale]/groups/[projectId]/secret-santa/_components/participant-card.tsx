import type { SecretSantaPerson } from "@/app/_data/secret-santa";
import { Card } from "@/components/ui/card";
import UserAvatar from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export default function ParticipantCard({
  person,
  fallbackName,
  compact = false,
  className,
}: {
  person: SecretSantaPerson;
  /** Shown when the person has no name, e.g. a deleted account. */
  fallbackName: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "flex aspect-3/4 flex-col items-center justify-evenly gap-0 p-1.5",
        className,
      )}
    >
      <UserAvatar
        user={person}
        className={cn(
          "aspect-square h-auto w-[60%]",
          compact ? "text-xl" : "text-2xl",
        )}
      />
      <div
        className={cn(
          "flex items-center justify-center",
          compact ? "h-[30px]" : "h-[35px]",
        )}
      >
        <p
          className={cn(
            "wrap-anywhere line-clamp-2 text-ellipsis text-center text-card-foreground leading-tight",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {person.name ?? fallbackName}
        </p>
      </div>
    </Card>
  );
}
