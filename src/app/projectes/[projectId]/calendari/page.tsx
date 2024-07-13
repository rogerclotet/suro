import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Calendar from "./_components/calendar";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return <Calendar />;
}
