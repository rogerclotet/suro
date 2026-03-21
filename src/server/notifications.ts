"use server";

import { and, count, desc, eq, isNull, ne, notInArray, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "./db";
import {
  notificationReads,
  notifications,
  projects,
  projectToUsers,
} from "./db/schema";

export async function createNotification({
  type,
  title,
  body,
  path,
  section,
  image,
  projectId,
  createdBy,
}: {
  type: string;
  title?: string;
  body: string;
  path?: string;
  section: string;
  image?: string;
  projectId: string;
  createdBy: string;
}) {
  const [notification] = await db
    .insert(notifications)
    .values({
      type,
      title,
      body,
      path,
      section,
      image,
      projectId,
      createdBy,
    })
    .returning();

  return notification;
}

export async function getNotificationsForUser(
  userId: string,
  { limit = 100, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const results = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      path: notifications.path,
      section: notifications.section,
      image: notifications.image,
      projectId: notifications.projectId,
      createdBy: notifications.createdBy,
      createdAt: notifications.createdAt,
      projectName: projects.name,
      projectColor: projects.color,
      projectImage: projects.image,
      readAt: notificationReads.readAt,
    })
    .from(notifications)
    .innerJoin(
      projectToUsers,
      and(
        eq(notifications.projectId, projectToUsers.projectId),
        eq(projectToUsers.userId, userId),
      ),
    )
    .innerJoin(projects, eq(notifications.projectId, projects.id))
    .leftJoin(
      notificationReads,
      and(
        eq(notifications.id, notificationReads.notificationId),
        eq(notificationReads.userId, userId),
      ),
    )
    .where(ne(notifications.createdBy, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return results.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    path: r.path,
    section: r.section,
    image: r.image,
    projectId: r.projectId,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    projectName: r.projectName,
    projectColor: r.projectColor,
    projectImage: r.projectImage,
    isRead: r.readAt !== null,
  }));
}

export async function getUnreadCountsForUser(
  userId: string,
  projectId: string,
) {
  const results = await db
    .select({
      section: notifications.section,
      count: count(),
    })
    .from(notifications)
    .innerJoin(
      projectToUsers,
      and(
        eq(notifications.projectId, projectToUsers.projectId),
        eq(projectToUsers.userId, userId),
      ),
    )
    .leftJoin(
      notificationReads,
      and(
        eq(notifications.id, notificationReads.notificationId),
        eq(notificationReads.userId, userId),
      ),
    )
    .where(
      and(
        eq(notifications.projectId, projectId),
        ne(notifications.createdBy, userId),
        isNull(notificationReads.readAt),
      ),
    )
    .groupBy(notifications.section);

  const counts: Record<string, number> = {};
  for (const row of results) {
    counts[row.section] = row.count;
  }
  return counts;
}

export async function getTotalUnreadCount(userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .innerJoin(
      projectToUsers,
      and(
        eq(notifications.projectId, projectToUsers.projectId),
        eq(projectToUsers.userId, userId),
      ),
    )
    .leftJoin(
      notificationReads,
      and(
        eq(notifications.id, notificationReads.notificationId),
        eq(notificationReads.userId, userId),
      ),
    )
    .where(
      and(
        ne(notifications.createdBy, userId),
        isNull(notificationReads.readAt),
      ),
    );

  return result?.count ?? 0;
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
) {
  await db
    .insert(notificationReads)
    .values({ notificationId, userId })
    .onConflictDoNothing();
}

export async function markAllAsRead(userId: string) {
  const session = await auth();
  if (!session) return;

  // Get all unread notification IDs for this user
  const readNotificationIds = db
    .select({ notificationId: notificationReads.notificationId })
    .from(notificationReads)
    .where(eq(notificationReads.userId, userId));

  const unreadNotifications = await db
    .select({ id: notifications.id })
    .from(notifications)
    .innerJoin(
      projectToUsers,
      and(
        eq(notifications.projectId, projectToUsers.projectId),
        eq(projectToUsers.userId, userId),
      ),
    )
    .where(
      and(
        ne(notifications.createdBy, userId),
        notInArray(notifications.id, readNotificationIds),
      ),
    );

  if (unreadNotifications.length === 0) return;

  await db.insert(notificationReads).values(
    unreadNotifications.map((n) => ({
      notificationId: n.id,
      userId,
    })),
  );
}
