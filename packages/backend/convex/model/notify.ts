import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  type NotificationTarget,
  notificationPath,
  sectionForTarget,
} from "./notificationTarget";

type Activity = {
  projectId: Id<"projects">;
  bodyKey: string;
  bodyParams: Record<string, string>;
  target: NotificationTarget;
};

/** Persist unread state in the same transaction that schedules the existing push. */
export async function notifyUsers(
  ctx: MutationCtx,
  activity: Activity & { userIds: Id<"users">[] },
) {
  const { projectId, target, bodyKey, bodyParams } = activity;
  const project = await ctx.db.get(projectId);
  if (!project) return;
  const userIds: Id<"users">[] = [];
  for (const userId of new Set(activity.userIds)) {
    const membership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", projectId).eq("userId", userId),
      )
      .unique();
    if (!membership) continue;
    userIds.push(userId);
    await ctx.db.insert("notifications", {
      userId,
      projectId,
      section: sectionForTarget(target),
      target,
    });
  }
  await ctx.db.patch(projectId, { lastActivityAt: Date.now() });
  if (userIds.length) {
    await ctx.scheduler.runAfter(0, internal.push.sendToUsers, {
      userIds,
      projectId,
      bodyKey,
      bodyParams,
      path: notificationPath(projectId, target),
    });
  }
}

export async function notifyProject(
  ctx: MutationCtx,
  activity: Activity & { actorId: Id<"users"> },
) {
  const members = await ctx.db
    .query("projectMembers")
    .withIndex("by_project", (q) => q.eq("projectId", activity.projectId))
    .collect();
  await notifyUsers(ctx, {
    ...activity,
    userIds: members
      .filter((member) => member.userId !== activity.actorId)
      .map((member) => member.userId),
  });
}
