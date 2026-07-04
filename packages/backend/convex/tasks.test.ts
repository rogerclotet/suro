import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

type Ids = {
  alice: Id<"users">;
  bob: Id<"users">;
  carol: Id<"users">;
  family: Id<"projects">;
};

let t: ReturnType<typeof convexTest>;
let ids: Ids;
let alice: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>;

beforeEach(async () => {
  t = convexTest(schema, modules);
  ids = await t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", {
      name: "Alice",
      email: "alice@x.test",
      locale: "en",
    });
    const bob = await ctx.db.insert("users", {
      name: "Bob",
      email: "bob@x.test",
      locale: "es",
    });
    // Carol exists but is NOT a member of family — for the assignee-guard test.
    const carol = await ctx.db.insert("users", {
      name: "Carol",
      email: "carol@x.test",
    });
    const family = await ctx.db.insert("projects", {
      name: "Family",
      createdBy: alice,
      inviteToken: "tok",
      color: "blue",
    });
    await ctx.db.insert("projectMembers", { projectId: family, userId: alice });
    await ctx.db.insert("projectMembers", { projectId: family, userId: bob });
    return { alice, bob, carol, family };
  });
  alice = t.withIdentity({ subject: `${ids.alice}|session` });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function insertTaskList(name: string, taskMode = true) {
  return t.run((ctx) =>
    ctx.db.insert("lists", {
      name,
      description: "",
      projectId: ids.family,
      favorite: false,
      taskMode,
      createdBy: ids.alice,
      updatedAt: Date.now(),
    }),
  );
}

function insertTaskItem(
  listId: Id<"lists">,
  name: string,
  opts: {
    dueAt?: number;
    dueAllDay?: boolean;
    priority?: "low" | "normal" | "high";
    assigneeId?: Id<"users">;
    completed?: boolean;
    reminderSentForDueAt?: number;
  } = {},
) {
  return t.run((ctx) =>
    ctx.db.insert("listItems", {
      name,
      completed: opts.completed ?? false,
      listId,
      createdBy: ids.alice,
      updatedAt: Date.now(),
      dueAt: opts.dueAt,
      dueAllDay: opts.dueAllDay,
      priority: opts.priority,
      assigneeId: opts.assigneeId,
      reminderSentForDueAt: opts.reminderSentForDueAt,
    }),
  );
}

function stubExpo(payload: unknown = { data: [{ status: "ok" }] }, ok = true) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
    ok,
    status: ok ? 200 : 500,
    json: async () => payload,
  }));
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  return fetchMock;
}

describe("task-mode ordering", () => {
  it("orders by due date, then priority, then name; completed last", async () => {
    const list = await insertTaskList("Chores");
    await insertTaskItem(list, "alpha", { dueAt: 100, priority: "normal" });
    await insertTaskItem(list, "beta", { dueAt: 100, priority: "high" });
    await insertTaskItem(list, "gamma", { dueAt: 200 });
    await insertTaskItem(list, "delta"); // no due date -> last among incomplete
    await insertTaskItem(list, "epsilon", { dueAt: 50, completed: true });

    const result = await alice.query(api.lists.get, { listId: list });
    expect(result?.items.map((i) => i.name)).toEqual([
      "beta",
      "alpha",
      "gamma",
      "delta",
      "epsilon",
    ]);
  });

  it("keeps the plain-checklist (name) order when not in task mode", async () => {
    const list = await insertTaskList("Shopping", false);
    await insertTaskItem(list, "Banana", { dueAt: 1 });
    await insertTaskItem(list, "Apple", { dueAt: 999 });

    const result = await alice.query(api.lists.get, { listId: list });
    // Due dates are ignored on a checklist — alphabetical, like before.
    expect(result?.items.map((i) => i.name)).toEqual(["Apple", "Banana"]);
  });
});

describe("reschedule on complete", () => {
  it("advances a recurring task's due date instead of completing it", async () => {
    const list = await insertTaskList("Chores");
    const due = Date.parse("2024-01-01T09:00:00Z");
    const item = await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Trash",
      dueAt: due,
      recurrence: { freq: "daily", interval: 1 },
    });
    await t.run((ctx) => ctx.db.patch(item, { reminderSentForDueAt: due }));

    await alice.mutation(api.listItems.update, {
      itemId: item,
      name: "Trash",
      completed: true,
      category: null,
      dueAt: due,
      recurrence: { freq: "daily", interval: 1 },
    });

    const row = await t.run((ctx) => ctx.db.get(item));
    if (row === null) throw new Error("item missing");
    expect(row.completed).toBe(false);
    expect(row.reminderSentForDueAt).toBeUndefined();
    const nextDue = row.dueAt;
    if (nextDue === undefined) throw new Error("dueAt missing");
    expect(nextDue).toBeGreaterThan(due);
    expect((nextDue - due) % 86_400_000).toBe(0); // whole days ahead
    expect(new Date(nextDue).getUTCHours()).toBe(9); // time preserved
  });

  it("completes normally once the repeat is cleared in the same edit", async () => {
    const list = await insertTaskList("Chores");
    const due = Date.parse("2024-01-01T09:00:00Z");
    const item = await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Trash",
      dueAt: due,
      recurrence: { freq: "daily", interval: 1 },
    });

    await alice.mutation(api.listItems.update, {
      itemId: item,
      name: "Trash",
      completed: true,
      category: null,
      dueAt: due,
      // recurrence omitted -> the task is no longer recurring, so it completes.
    });

    const row = await t.run((ctx) => ctx.db.get(item));
    expect(row?.completed).toBe(true);
    expect(row?.recurrence).toBeUndefined();
  });

  it("re-arms the reminder when the due date is moved", async () => {
    const list = await insertTaskList("Chores");
    const due = Date.parse("2024-01-01T09:00:00Z");
    const item = await insertTaskItem(list, "Trash", {
      dueAt: due,
      reminderSentForDueAt: due,
    });
    await alice.mutation(api.listItems.update, {
      itemId: item,
      name: "Trash",
      completed: false,
      category: null,
      dueAt: due + 86_400_000,
    });
    const row = await t.run((ctx) => ctx.db.get(item));
    expect(row?.reminderSentForDueAt).toBeUndefined();
  });
});

describe("assignee validation", () => {
  it("rejects assigning a task to a non-member", async () => {
    const list = await insertTaskList("Chores");
    await expect(
      alice.mutation(api.listItems.create, {
        listId: list,
        name: "Trash",
        assigneeId: ids.carol,
      }),
    ).rejects.toThrow();
  });

  it("allows assigning a task to a fellow member", async () => {
    const list = await insertTaskList("Chores");
    const item = await alice.mutation(api.listItems.create, {
      listId: list,
      name: "Trash",
      assigneeId: ids.bob,
    });
    const row = await t.run((ctx) => ctx.db.get(item));
    expect(row?.assigneeId).toBe(ids.bob);
  });
});

describe("myTasks agenda", () => {
  it("returns the caller's incomplete tasks across task lists, by due date", async () => {
    const listA = await insertTaskList("Chores");
    const listB = await insertTaskList("Errands");
    const plain = await insertTaskList("Shopping", false);

    await insertTaskItem(listA, "later", { assigneeId: ids.alice, dueAt: 200 });
    await insertTaskItem(listA, "soon", { assigneeId: ids.alice, dueAt: 100 });
    await insertTaskItem(listA, "bobs", { assigneeId: ids.bob, dueAt: 50 });
    await insertTaskItem(listA, "done", {
      assigneeId: ids.alice,
      dueAt: 10,
      completed: true,
    });
    await insertTaskItem(listA, "unassigned", { dueAt: 5 });
    await insertTaskItem(listB, "mid", { assigneeId: ids.alice, dueAt: 150 });
    // In a non-task list, so excluded even though assigned to alice.
    await insertTaskItem(plain, "ignored", { assigneeId: ids.alice, dueAt: 1 });

    const tasks = await alice.query(api.tasks.myTasks, {
      projectId: ids.family,
    });
    expect(tasks.map((task) => task.name)).toEqual(["soon", "mid", "later"]);
    expect(tasks[0]?.listName).toBe("Chores");
  });

  it("can fetch another member's tasks", async () => {
    const list = await insertTaskList("Chores");
    await insertTaskItem(list, "bobs", { assigneeId: ids.bob, dueAt: 100 });
    const tasks = await alice.query(api.tasks.myTasks, {
      projectId: ids.family,
      assigneeId: ids.bob,
    });
    expect(tasks.map((task) => task.name)).toEqual(["bobs"]);
  });
});

describe("due reminders", () => {
  it("returns each due task once and re-arms after the due date moves", async () => {
    const list = await insertTaskList("Chores");
    const item = await insertTaskItem(list, "Trash", {
      assigneeId: ids.alice,
      dueAt: 1000,
    });

    const first = await t.query(internal.tasks.dueRemindersDue, {
      before: Date.now(),
    });
    expect(first.map((task) => task.itemId)).toEqual([item]);

    await t.mutation(internal.tasks.markReminded, {
      items: [{ itemId: item, dueAt: 1000 }],
    });
    const second = await t.query(internal.tasks.dueRemindersDue, {
      before: Date.now(),
    });
    expect(second).toHaveLength(0);

    // Moving the due date clears the marker, so it's due again.
    await t.run((ctx) => ctx.db.patch(item, { dueAt: 2000 }));
    const third = await t.query(internal.tasks.dueRemindersDue, {
      before: Date.now(),
    });
    expect(third.map((task) => task.itemId)).toEqual([item]);
  });

  it("excludes completed, unassigned, and not-yet-due tasks", async () => {
    const list = await insertTaskList("Chores");
    await insertTaskItem(list, "done", {
      assigneeId: ids.alice,
      dueAt: 1000,
      completed: true,
    });
    await insertTaskItem(list, "unassigned", { dueAt: 1000 });
    await insertTaskItem(list, "future", {
      assigneeId: ids.alice,
      dueAt: Date.now() + 86_400_000,
    });
    await insertTaskItem(list, "no-due", { assigneeId: ids.alice });

    const due = await t.query(internal.tasks.dueRemindersDue, {
      before: Date.now(),
    });
    expect(due).toHaveLength(0);
  });

  it("holds an all-day reminder until the morning-of offset", async () => {
    const list = await insertTaskList("Chores");
    const midnight = Date.UTC(2030, 0, 1); // future all-day due
    const item = await insertTaskItem(list, "Birthday", {
      assigneeId: ids.alice,
      dueAt: midnight,
      dueAllDay: true,
    });
    // Just after midnight: not yet eligible.
    expect(
      await t.query(internal.tasks.dueRemindersDue, {
        before: midnight + 60_000,
      }),
    ).toHaveLength(0);
    // After the 9h offset: eligible.
    const ready = await t.query(internal.tasks.dueRemindersDue, {
      before: midnight + 9 * 60 * 60 * 1000 + 1000,
    });
    expect(ready.map((task) => task.itemId)).toEqual([item]);
  });

  it("pushes due reminders to the assignee, then dedupes", async () => {
    const list = await insertTaskList("Chores");
    const item = await insertTaskItem(list, "Trash", {
      assigneeId: ids.alice,
      dueAt: 1000,
    });
    await t.run((ctx) =>
      ctx.db.insert("pushTokens", {
        userId: ids.alice,
        token: "ExpoToken[alice]",
      }),
    );

    const fetchMock = stubExpo();
    await t.action(internal.tasks.sendDueReminders, {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body[0]).toMatchObject({
      to: "ExpoToken[alice]",
      title: "Family",
      body: "Task due: Trash",
      channelId: "tasks",
    });
    const row = await t.run((ctx) => ctx.db.get(item));
    expect(row?.reminderSentForDueAt).toBe(1000);

    // Second run: already reminded, so no further push.
    await t.action(internal.tasks.sendDueReminders, {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("sendToUsers", () => {
  it("notifies the listed users (no actor exclusion), localized, on the tasks channel", async () => {
    await t.run(async (ctx) => {
      await ctx.db.insert("pushTokens", {
        userId: ids.alice,
        token: "ExpoToken[alice]",
      });
      await ctx.db.insert("pushTokens", {
        userId: ids.bob,
        token: "ExpoToken[bob]",
      });
    });
    const fetchMock = stubExpo({ data: [{ status: "ok" }, { status: "ok" }] });
    await t.action(internal.push.sendToUsers, {
      userIds: [ids.alice, ids.bob],
      projectId: ids.family,
      bodyKey: "task_assigned",
      bodyParams: { name: "Trash" },
      path: `/${ids.family}/lists`,
    });
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    const byToken = new Map(
      body.map((m: { to: string; body: string; channelId: string }) => [
        m.to,
        m,
      ]),
    );
    expect(byToken.get("ExpoToken[alice]")).toMatchObject({
      body: "Task assigned: Trash", // en
      channelId: "tasks",
    });
    expect(byToken.get("ExpoToken[bob]")).toMatchObject({
      body: "Tarea asignada: Trash", // es
    });
  });
});
