import { CheckIcon } from "lucide-react";
import type { SecretSantaPerson } from "@/app/_data/secret-santa";
import UserAvatar from "@/components/user-avatar";
import { cn } from "@/lib/utils";

/** An avatar over a two-line name, for participant grids and pickers. */
export default function ParticipantTile({
  person,
  fallbackName,
  selected = false,
  className,
}: {
  person: SecretSantaPerson;
  /** Shown when the person has no name, e.g. a deleted account. */
  fallbackName: string;
  selected?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex w-20 flex-col items-center gap-1.5", className)}>
      <div
        className={cn(
          "relative rounded-full border-2 p-0.5",
          selected ? "border-primary" : "border-transparent",
        )}
      >
        <UserAvatar user={person} className="size-12 text-lg" />
        {selected && (
          <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
            <CheckIcon className="size-3" strokeWidth={3} />
          </span>
        )}
      </div>
      <p
        className={cn(
          "wrap-anywhere line-clamp-2 h-8 text-center text-xs leading-tight",
          selected && "font-semibold text-primary",
        )}
      >
        {person.name ?? fallbackName}
      </p>
    </div>
  );
}
