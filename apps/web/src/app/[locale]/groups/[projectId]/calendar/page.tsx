import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { normalizeDateLocale, parseDateOnly } from "@/lib/date-locale";
import Calendar from "./_components/calendar";

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { projectId } = await params;
  const { d: day } = await searchParams;

  const session = await auth();
  if (!session) {
    redirect("/");
  }

  if (day) {
    const date = parseDateOnly(day);
    if (Number.isNaN(date.getTime())) {
      redirect(`/groups/${projectId}/calendar`);
    }
  }

  return <Calendar dateLocale={normalizeDateLocale(session.user.dateLocale)} />;
}
