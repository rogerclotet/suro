import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { createNotification } from "./notifications";
import { sendNotificationsToUsers } from "./push-delivery";

export { sendNotificationsToUsers } from "./push-delivery";

export async function sendProjectNotification({
  project,
  body,
  title,
  path,
  image,
  type,
  section,
}: {
  project: Project;
  body: string;
  title?: string;
  path?: string;
  image?: string;
  type: string;
  section: string;
}) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Always persist the notification to the database
  await createNotification({
    type,
    title,
    body,
    path,
    section,
    image,
    projectId: project.id,
    createdBy: session.user.id,
  });

  const usersToNotify = project.users.filter(
    (u) => u.user.id !== session.user.id,
  );
  if (usersToNotify.length === 0) {
    return;
  }

  await sendNotificationsToUsers({
    users: usersToNotify.map((u) => u.user.id),
    body,
    title,
    path,
    image,
  });
}
