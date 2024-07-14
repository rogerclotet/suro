import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { ListPlus, ListTodo, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function EventDetails({ event }: { event: Event }) {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: list, isLoading } = useQuery({
    queryKey: ["event-list", event.id],
    queryFn: async () => {
      const res = await fetch(`/api/${projectId}/events/${event.id}/list`);
      if (res.status === 404) {
        return null;
      }
      return res.json() as Promise<List>;
    },
    staleTime: 60 * 1000,
  });

  return (
    <Card key={event.id}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{event.name}</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {list ? <ListTodo /> : <ListPlus />}
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>{list ? "Editar" : "Crear"} llista</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>
          {event.startAt.toLocaleString("ca-ES", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {" - "}
          {event.endAt.toLocaleString("ca-ES", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </CardDescription>
      </CardHeader>
      {event.description && <CardContent>{event.description}</CardContent>}
    </Card>
  );
}
