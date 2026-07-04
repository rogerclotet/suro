import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  type ActionCtx,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { localizeNotification } from "./model/pushI18n";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

/**
 * The Android notification channel each push lands in, grouped by app section so
 * a member can mute one category (e.g. expenses) from the OS settings without
 * losing the rest. The ids must match the channels the mobile app registers in
 * apps/mobile/src/lib/push.ts — keep the two lists in sync. iOS has no channels,
 * so Expo ignores `channelId` for those tokens.
 */
const CHANNEL_BY_BODY_KEY: Record<string, string> = {
  event_created: "events",
  list_created: "lists",
  note_created: "notes",
  template_created: "templates",
  file_uploaded: "files",
  member_joined: "members",
  member_left: "members",
  pot_created: "expenses",
  spending_created: "expenses",
  spending_created_with_description: "expenses",
  task_assigned: "tasks",
  task_due: "tasks",
};

type Recipient = { token: string; locale: string };

/**
 * The project's name plus the push tokens of every member EXCEPT the actor, each
 * paired with that member's locale (for server-side copy localization).
 */
export const recipientsForProject = internalQuery({
  args: { projectId: v.id("projects"), actorId: v.id("users") },
  handler: async (ctx, { projectId, actorId }) => {
    const project = await ctx.db.get(projectId);
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const recipients: Recipient[] = [];
    for (const membership of memberships) {
      if (membership.userId === actorId) {
        continue;
      }
      const user = await ctx.db.get(membership.userId);
      const locale = user?.locale ?? "ca";
      const tokens = await ctx.db
        .query("pushTokens")
        .withIndex("by_user", (q) => q.eq("userId", membership.userId))
        .collect();
      for (const { token } of tokens) {
        recipients.push({ token, locale });
      }
    }
    return { projectName: project?.name ?? "", recipients };
  },
});

/**
 * The project's name plus the push tokens of the given users (deduped), each
 * paired with that user's locale. Unlike `recipientsForProject` there's no actor
 * exclusion — the caller decides who to notify (e.g. a task's assignee).
 */
export const recipientsForUsers = internalQuery({
  args: { userIds: v.array(v.id("users")), projectId: v.id("projects") },
  handler: async (ctx, { userIds, projectId }) => {
    const project = await ctx.db.get(projectId);
    const recipients: Recipient[] = [];
    for (const userId of [...new Set(userIds)]) {
      const user = await ctx.db.get(userId);
      const locale = user?.locale ?? "ca";
      const tokens = await ctx.db
        .query("pushTokens")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const { token } of tokens) {
        recipients.push({ token, locale });
      }
    }
    return { projectName: project?.name ?? "", recipients };
  },
});

export const pruneTokens = internalMutation({
  args: { tokens: v.array(v.string()) },
  handler: async (ctx, { tokens }) => {
    for (const token of tokens) {
      const row = await ctx.db
        .query("pushTokens")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();
      if (row) {
        await ctx.db.delete(row._id);
      }
    }
    return null;
  },
});

/**
 * Localize + POST a push to a resolved recipient list, then prune any token Expo
 * reports as gone. Shared by `sendToProject` and `sendToUsers`. Runs in the V8
 * runtime — `fetch` is available, no `"use node"` needed.
 */
async function deliver(
  ctx: ActionCtx,
  title: string,
  bodyKey: string,
  bodyParams: Record<string, string>,
  path: string,
  recipients: Recipient[],
): Promise<void> {
  if (recipients.length === 0) {
    return;
  }
  // Android-only; Expo ignores it for iOS tokens. Routes the push to the
  // section's channel so members can mute one category in the OS settings.
  const channelId = CHANNEL_BY_BODY_KEY[bodyKey];
  const messages = recipients.map((recipient) => ({
    to: recipient.token,
    title,
    body: localizeNotification(bodyKey, bodyParams, recipient.locale),
    data: { path },
    ...(channelId ? { channelId } : {}),
  }));

  // Expo accepts up to 100 messages per request; groups are small, so a single
  // request is enough. Chunk here if a group ever exceeds that.
  let response: Response;
  try {
    response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error("Expo push request failed", error);
    return;
  }
  if (!response.ok) {
    console.error(`Expo push returned ${response.status}`);
    return;
  }

  // Tickets come back in the same order as the messages sent. Prune any token
  // Expo reports as gone, mirroring the web's 404/410 subscription pruning.
  const result = (await response.json()) as {
    data?: { status?: string; details?: { error?: string } }[];
  };
  const tickets = result.data ?? [];
  const dead: string[] = [];
  tickets.forEach((ticket, index) => {
    const recipient = recipients[index];
    if (
      ticket?.status === "error" &&
      ticket.details?.error === "DeviceNotRegistered" &&
      recipient
    ) {
      dead.push(recipient.token);
    }
  });
  if (dead.length > 0) {
    await ctx.runMutation(internal.push.pruneTokens, { tokens: dead });
  }
}

/**
 * Deliver a push to a project's other members. Scheduled from create mutations
 * via `ctx.scheduler.runAfter(0, ...)` so it runs after the write commits, off
 * the transaction (the Convex analog of the PWA's fire-and-forget `setTimeout`).
 */
export const sendToProject = internalAction({
  args: {
    projectId: v.id("projects"),
    actorId: v.id("users"),
    bodyKey: v.string(),
    bodyParams: v.record(v.string(), v.string()),
    path: v.string(),
  },
  handler: async (ctx, { projectId, actorId, bodyKey, bodyParams, path }) => {
    const { projectName, recipients } = await ctx.runQuery(
      internal.push.recipientsForProject,
      { projectId, actorId },
    );
    await deliver(ctx, projectName, bodyKey, bodyParams, path, recipients);
    return null;
  },
});

/**
 * Deliver a push to specific users (e.g. a task's assignee), titled with the
 * project name like `sendToProject`. The caller guards against notifying the
 * actor themselves.
 */
export const sendToUsers = internalAction({
  args: {
    userIds: v.array(v.id("users")),
    projectId: v.id("projects"),
    bodyKey: v.string(),
    bodyParams: v.record(v.string(), v.string()),
    path: v.string(),
  },
  handler: async (ctx, { userIds, projectId, bodyKey, bodyParams, path }) => {
    const { projectName, recipients } = await ctx.runQuery(
      internal.push.recipientsForUsers,
      { userIds, projectId },
    );
    await deliver(ctx, projectName, bodyKey, bodyParams, path, recipients);
    return null;
  },
});
