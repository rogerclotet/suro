import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import { deleteUserAccount } from "./model/account";
import { notifyUsers } from "./model/notify";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", { name: "Alice" });
    const bob = await ctx.db.insert("users", { name: "Bob" });
    const outsider = await ctx.db.insert("users", { name: "Outsider" });
    const group = await ctx.db.insert("projects", {
      name: "Family",
      createdBy: alice,
      inviteToken: "invite",
      color: "blue",
    });
    for (const userId of [alice, bob])
      await ctx.db.insert("projectMembers", { projectId: group, userId });
    return { alice, bob, outsider, group };
  });
  return {
    t,
    ids,
    alice: t.withIdentity({ subject: `${ids.alice}|session` }),
    bob: t.withIdentity({ subject: `${ids.bob}|session` }),
    outsider: t.withIdentity({ subject: `${ids.outsider}|session` }),
  };
}
let ctx: Awaited<ReturnType<typeof setup>>;
beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () => new Response(JSON.stringify({ data: [{ status: "ok" }] })),
    ),
  );
  ctx = await setup();
});
afterEach(async () => {
  await ctx.t.finishAllScheduledFunctions(vi.runAllTimers);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function newEvent(name: string, startAt: number) {
  return ctx.alice.mutation(api.events.create, {
    projectId: ctx.ids.group,
    name,
    startAt,
    endAt: startAt + 3_600_000,
    allDay: false,
  });
}
function newList(name = "Groceries") {
  return ctx.alice.mutation(api.lists.create, {
    projectId: ctx.ids.group,
    name,
  });
}

describe("unread activity", () => {
  it("records creation without push tokens and excludes the actor and nonmembers", async () => {
    const eventId = await newEvent("Next month", Date.UTC(2027, 1, 12));
    expect(await ctx.alice.query(api.notifications.unread)).toEqual([]);
    expect(await ctx.outsider.query(api.notifications.unread)).toEqual([]);
    expect(await ctx.bob.query(api.notifications.unread)).toMatchObject([
      {
        section: "calendar",
        count: 1,
        destination: { kind: "calendar", startAt: Date.UTC(2027, 1, 12) },
      },
    ]);
    const stored = await ctx.t.run((c) =>
      c.db.query("notifications").collect(),
    );
    expect(stored[0]?.target).toEqual({ kind: "calendar", eventId });
  });

  it("selects the most recently received event, even if its date is earlier", async () => {
    await newEvent("Later", Date.UTC(2027, 4, 1));
    vi.advanceTimersByTime(1);
    const newest = await newEvent("Sooner", Date.UTC(2027, 1, 12));
    expect(await ctx.bob.query(api.notifications.unread)).toMatchObject([
      {
        count: 2,
        destination: { kind: "calendar", startAt: Date.UTC(2027, 1, 12) },
      },
    ]);
    await ctx.t.run((c) =>
      c.db.patch(newest, { startAt: Date.UTC(2027, 2, 12) }),
    );
    expect(await ctx.bob.query(api.notifications.unread)).toMatchObject([
      { destination: { kind: "calendar", startAt: Date.UTC(2027, 2, 12) } },
    ]);
  });

  it("clears a section snapshot across devices, keeping other sections and newer arrivals", async () => {
    await newEvent("First", Date.UTC(2027, 1, 1));
    await newList();
    const receipt = (await ctx.bob.query(api.notifications.unread)).find(
      (r) => r.section === "calendar",
    );
    if (!receipt) throw new Error("Expected a calendar receipt");
    await newEvent("Arrived during navigation", Date.UTC(2027, 2, 1));
    await ctx.bob.mutation(api.notifications.markRead, {
      projectId: ctx.ids.group,
      ids: receipt.ids,
    });
    const secondDevice = ctx.t.withIdentity({
      subject: `${ctx.ids.bob}|other-session`,
    });
    const unread = await secondDevice.query(api.notifications.unread);
    expect(unread.find((r) => r.section === "calendar")?.count).toBe(1);
    expect(unread.find((r) => r.section === "lists")?.count).toBe(1);
    await ctx.bob.mutation(api.notifications.markRead, {
      projectId: ctx.ids.group,
      ids: receipt.ids,
    });
    expect(await secondDevice.query(api.notifications.unread)).toEqual(unread);
  });

  it("rejects clearing another user's receipts or reading a nonmember group", async () => {
    await newList();
    const receipt = (await ctx.bob.query(api.notifications.unread))[0];
    if (!receipt) throw new Error("Expected a receipt");
    await expect(
      ctx.alice.mutation(api.notifications.markRead, {
        projectId: ctx.ids.group,
        ids: receipt.ids,
      }),
    ).rejects.toThrow("does not belong");
    await expect(
      ctx.outsider.mutation(api.notifications.markRead, {
        projectId: ctx.ids.group,
        ids: receipt.ids,
      }),
    ).rejects.toThrow();
    await expect(ctx.t.query(api.notifications.unread)).rejects.toThrow();
    expect((await ctx.bob.query(api.notifications.unread))[0]?.count).toBe(1);
  });

  it("falls back to the section when the most recent target was deleted", async () => {
    const eventId = await newEvent("Deleted", Date.UTC(2027, 1, 1));
    const listId = await newList();
    await ctx.t.run(async (c) => {
      await c.db.delete(eventId);
      await c.db.delete(listId);
    });
    const unread = await ctx.bob.query(api.notifications.unread);
    expect(unread.find((r) => r.section === "calendar")?.destination).toEqual({
      kind: "path",
      path: `/${ctx.ids.group}/calendar`,
    });
    expect(unread.find((r) => r.section === "lists")?.destination).toEqual({
      kind: "path",
      path: `/${ctx.ids.group}/lists`,
    });
  });

  it("maps notes, files, templates and expenses to their existing push destinations", async () => {
    const projectId = ctx.ids.group;
    const noteId = await ctx.alice.mutation(api.notes.create, {
      projectId,
      name: "Plan",
    });
    const templateId = await ctx.alice.mutation(api.templates.create, {
      projectId,
      name: "Trip",
      items: [],
    });
    const storageId = await ctx.t.run((c) =>
      c.storage.store(new Blob(["hello"])),
    );
    await ctx.alice.mutation(api.files.saveFile, {
      projectId,
      storageId,
      name: "Readme",
      type: "text/plain",
      size: 5,
    });
    const potId = await ctx.alice.mutation(api.expenses.createPot, {
      projectId,
      name: "Dinner",
      memberIds: [ctx.ids.alice, ctx.ids.bob],
    });
    await ctx.alice.mutation(api.expenses.createSpending, {
      potId,
      amount: 500,
      from: ctx.ids.alice,
    });
    await ctx.alice.mutation(api.expenses.createSpending, {
      potId,
      amount: 200,
      from: ctx.ids.alice,
      description: "Coffee",
    });
    const unread = await ctx.bob.query(api.notifications.unread);
    expect(unread.find((r) => r.section === "expenses")?.count).toBe(3);
    expect(unread.find((r) => r.section === "notes")?.destination).toEqual({
      kind: "path",
      path: `/${projectId}/notes/${noteId}`,
    });
    expect(unread.find((r) => r.section === "lists")?.destination).toEqual({
      kind: "path",
      path: `/${projectId}/lists/templates/${templateId}`,
    });
    expect(unread.find((r) => r.section === "files")?.destination).toEqual({
      kind: "path",
      path: `/${projectId}/files`,
    });
    expect(unread.find((r) => r.section === "expenses")?.destination).toEqual({
      kind: "path",
      path: `/${projectId}/expenses/${potId}`,
    });
  });

  it("notifies only the task assignee, with no new receipt for ordinary edits or completion", async () => {
    const listId = await newList();
    const receipt = (await ctx.bob.query(api.notifications.unread))[0];
    if (!receipt) throw new Error("Expected a list receipt");
    await ctx.bob.mutation(api.notifications.markRead, {
      projectId: ctx.ids.group,
      ids: receipt.ids,
    });
    const itemId = await ctx.alice.mutation(api.listItems.create, {
      listId,
      name: "Milk",
      assigneeId: ctx.ids.bob,
    });
    expect((await ctx.bob.query(api.notifications.unread))[0]?.count).toBe(1);
    await ctx.alice.mutation(api.listItems.update, {
      itemId,
      name: "Milk",
      completed: true,
      assigneeId: ctx.ids.bob,
    });
    expect((await ctx.bob.query(api.notifications.unread))[0]?.count).toBe(1);
    expect(await ctx.alice.query(api.notifications.unread)).toEqual([]);
  });

  it("claims due reminders once and keeps their unread state when pushes fail", async () => {
    const listId = await newList();
    const itemId = await ctx.alice.mutation(api.listItems.create, {
      listId,
      name: "Due",
      assigneeId: ctx.ids.alice,
      dueAt: 1,
    });
    await ctx.t.run((c) =>
      c.db.insert("pushTokens", {
        userId: ctx.ids.alice,
        token: "ExpoToken[alice]",
      }),
    );
    vi.mocked(fetch).mockRejectedValueOnce(
      new Error("Push service unavailable"),
    );
    await ctx.t.mutation(internal.tasks.remind, { itemId, dueAt: 1 });
    await ctx.t.mutation(internal.tasks.remind, { itemId, dueAt: 1 });
    await ctx.t.finishAllScheduledFunctions(vi.runAllTimers);
    expect((await ctx.alice.query(api.notifications.unread))[0]?.count).toBe(1);
    expect(
      (await ctx.t.run((c) => c.db.get(itemId)))?.reminderSentForDueAt,
    ).toBe(1);
  });

  it("removes unread state on leaving, and notifies the remaining members", async () => {
    await newList();
    await ctx.bob.mutation(api.projects.leave, { projectId: ctx.ids.group });
    expect(await ctx.bob.query(api.notifications.unread)).toEqual([]);
    expect(await ctx.alice.query(api.notifications.unread)).toMatchObject([
      { section: "members", count: 1 },
    ]);
    const stored = await ctx.t.run((c) =>
      c.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", ctx.ids.bob))
        .collect(),
    );
    expect(stored).toHaveLength(0);
  });

  it("notifies existing members on join without giving the joiner old activity", async () => {
    await newList();
    await ctx.outsider.mutation(api.projects.acceptInvite, {
      projectId: ctx.ids.group,
      inviteToken: "invite",
    });
    expect(await ctx.outsider.query(api.notifications.unread)).toEqual([]);
    expect(await ctx.alice.query(api.notifications.unread)).toMatchObject([
      { section: "members", count: 1 },
    ]);
    await ctx.outsider.mutation(api.projects.acceptInvite, {
      projectId: ctx.ids.group,
      inviteToken: "invite",
    });
    expect((await ctx.alice.query(api.notifications.unread))[0]?.count).toBe(1);
  });

  it("deletes receipts with a group or recipient account", async () => {
    await newList();
    await ctx.t.run((c) => deleteUserAccount(c, ctx.ids.bob));
    expect(
      await ctx.t.run((c) => c.db.query("notifications").collect()),
    ).toEqual([]);
    await ctx.t.run((c) =>
      notifyUsers(c, {
        projectId: ctx.ids.group,
        userIds: [ctx.ids.alice],
        bodyKey: "task_due",
        bodyParams: { name: "Reminder" },
        target: { kind: "files" },
      }),
    );
    await ctx.alice.mutation(api.projects.remove, { projectId: ctx.ids.group });
    expect(
      await ctx.t.run((c) => c.db.query("notifications").collect()),
    ).toEqual([]);
  });

  it("deduplicates recipients and excludes former members", async () => {
    await ctx.t.run((c) =>
      notifyUsers(c, {
        projectId: ctx.ids.group,
        userIds: [ctx.ids.bob, ctx.ids.bob, ctx.ids.outsider],
        bodyKey: "file_uploaded",
        bodyParams: { name: "X" },
        target: { kind: "files" },
      }),
    );
    expect((await ctx.bob.query(api.notifications.unread))[0]?.count).toBe(1);
    expect(await ctx.outsider.query(api.notifications.unread)).toEqual([]);
  });
});
