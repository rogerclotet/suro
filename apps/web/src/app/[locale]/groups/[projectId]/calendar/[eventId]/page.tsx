import { checkAuth } from "@/lib/check-auth";
import EventDetail from "./_components/event-detail";

export default async function EventPage({
  params,
}: {
  params: Promise<{ projectId: string; eventId: string }>;
}) {
  await checkAuth();

  const { projectId, eventId } = await params;

  return <EventDetail projectId={projectId} eventId={eventId} />;
}
