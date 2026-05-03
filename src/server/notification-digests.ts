import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "./db";
import { notificationDigests, notifications, projects } from "./db/schema";
import {
  type DigestType,
  getNotificationDigestBody,
  getNotificationDigestParams,
} from "./notification-digest-messages";
import { sendNotificationsToUsers } from "./push-delivery";

const LIST_DIGEST_WINDOW_MS = 10 * 60 * 1000;

type ProjectForNotifications = {
  id: string;
  name: string;
  userIds: string[];
};

export async function flushNotificationDigests(
  projectIds?: string[],
  projectMap?: Map<string, ProjectForNotifications>,
) {
  const where = projectIds?.length
    ? and(
        lte(notificationDigests.sendAfter, new Date()),
        inArray(notificationDigests.projectId, projectIds),
      )
    : lte(notificationDigests.sendAfter, new Date());

  const pendingDigests = await db.query.notificationDigests.findMany({
    where,
    orderBy: (table, { asc }) => [asc(table.sendAfter)],
  });

  if (pendingDigests.length === 0) {
    return;
  }

  const requiredProjectIds = [
    ...new Set(
      pendingDigests
        .map((digest) => digest.projectId)
        .filter((projectId) => !projectMap?.has(projectId)),
    ),
  ];

  let fetchedProjects = new Map<string, ProjectForNotifications>();
  if (requiredProjectIds.length > 0) {
    const fetched = await db.query.projects.findMany({
      where: inArray(projects.id, requiredProjectIds),
      with: {
        users: {
          with: {
            user: true,
          },
        },
      },
    });

    fetchedProjects = new Map(
      fetched.map((project) => [
        project.id,
        {
          id: project.id,
          name: project.name,
          userIds: project.users.map((member) => member.user.id),
        },
      ]),
    );
  }

  for (const digest of pendingDigests) {
    const project =
      projectMap?.get(digest.projectId) ??
      fetchedProjects.get(digest.projectId);
    if (!project) {
      continue;
    }

    const params = getNotificationDigestParams({
      actorName: digest.actorName,
      count: digest.count,
      listName: digest.listName,
    });

    // Default body in app's default locale, used as fallback
    const fallbackBody = await getNotificationDigestBody({
      actorName: digest.actorName,
      count: digest.count,
      listName: digest.listName,
      type: digest.type as DigestType,
    });

    await db.insert(notifications).values({
      type: digest.type,
      body: fallbackBody,
      bodyParams: params,
      path: `/groups/${digest.projectId}/lists/${digest.listId}`,
      section: digest.section,
      projectId: digest.projectId,
      createdBy: digest.createdBy,
      title: project.name,
    });

    const usersToNotify = project.userIds.filter(
      (userId) => userId !== digest.createdBy,
    );

    await sendNotificationsToUsers({
      users: usersToNotify,
      body: fallbackBody,
      bodyKey: digest.type,
      bodyParams: params,
      path: `/groups/${digest.projectId}/lists/${digest.listId}`,
      title: project.name,
    });
  }

  await db.delete(notificationDigests).where(
    inArray(
      notificationDigests.id,
      pendingDigests.map((digest) => digest.id),
    ),
  );
}

export async function enqueueListNotificationDigest({
  actorId,
  actorName,
  listId,
  listName,
  project,
  type,
}: {
  actorId: string;
  actorName: string;
  listId: string;
  listName: string;
  project: ProjectForNotifications;
  type: DigestType;
}) {
  await flushNotificationDigests(
    [project.id],
    new Map([[project.id, project]]),
  );

  const openDigest = await db.query.notificationDigests.findFirst({
    where: and(
      eq(notificationDigests.projectId, project.id),
      eq(notificationDigests.createdBy, actorId),
      eq(notificationDigests.listId, listId),
      eq(notificationDigests.type, type),
      sql`${notificationDigests.sendAfter} > NOW()`,
    ),
  });

  if (openDigest) {
    await db
      .update(notificationDigests)
      .set({
        actorName,
        listName,
        count: openDigest.count + 1,
      })
      .where(eq(notificationDigests.id, openDigest.id));

    return;
  }

  await db.insert(notificationDigests).values({
    type,
    section: "lists",
    actorName,
    count: 1,
    listId,
    listName,
    projectId: project.id,
    createdBy: actorId,
    sendAfter: new Date(Date.now() + LIST_DIGEST_WINDOW_MS),
  });
}
