import { CheckIcon, Users } from "lucide-react";
import type { Pot } from "@/app/_data/pot";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function PotPreview({
  pot,
  projectId,
}: {
  pot: Pot;
  projectId: string;
}) {
  const isSettled = pot.settledAt !== null;

  return (
    <Link
      href={
        {
          pathname: "/groups/[projectId]/expenses/[potId]",
          params: { projectId, potId: pot.id },
        } as never
      }
      className="block break-inside-avoid-column"
    >
      {/* Settled pots recede: a muted fill plus a slight fade. */}
      <Card className={cn("h-full", isSettled && "bg-muted opacity-75")}>
        <CardHeader>
          <CardTitle>{pot.name}</CardTitle>

          <CardAction>
            {isSettled ? (
              <CheckIcon />
            ) : (
              <Badge variant="secondary">
                <Users className="mr-1 h-3 w-3" />
                {pot.users.length}
              </Badge>
            )}
          </CardAction>

          <CardDescription>
            <span className="flex items-center gap-1">
              {pot.users.map((u) => u.user.name).join(", ")}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
