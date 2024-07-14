import { auth } from "@/auth";
import { getEvents } from "@/server/events";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import Calendar from "./_components/calendar";
import getMonthString from "./_components/event/get-month-string";

export default async function CalendarPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["events", getMonthString(monthStart)],
    queryFn: async () => {
      if (!monthStart || !projectId) {
        return [];
      }

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);
      monthEnd.setDate(0);

      return await getEvents(projectId, monthStart, monthEnd);
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Calendar />
    </HydrationBoundary>
  );
}
