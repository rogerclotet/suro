import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEvents } from "@/server/events";
import Calendar from "./_components/calendar";
import getMonthString from "./_components/event/get-month-string";

export default async function CalendarPage({
  params: { projectId },
  searchParams: { d: day },
}: {
  params: { projectId: string };
  searchParams: { d?: string };
}) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  if (day) {
    const date = new Date(day);
    if (isNaN(date.getTime())) {
      redirect(`/grups/${projectId}/calendari`);
    }
  }

  const monthStart = day ? new Date(day) : new Date();
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
