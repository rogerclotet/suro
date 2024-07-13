import { auth } from "@/auth";
import { getEvents } from "@/server/events";
import { redirect } from "next/navigation";
import Calendar from "./_components/calendar";

export default async function CalendarPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const events = await getEvents(projectId);

  return <Calendar events={events} />;
}
