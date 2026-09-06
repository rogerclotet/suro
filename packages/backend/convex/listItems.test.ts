import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const user = await ctx.db.insert("users", { name: "Alice" });
    const outsider = await ctx.db.insert("users", { name: "Bob" });
    const project = await ctx.db.insert("projects", {
      name: "Home",
      createdBy: user,
      inviteToken: "invite",
      color: "blue",
    });
    await ctx.db.insert("projectMembers", { projectId: project, userId: user });
    const list = await ctx.db.insert("lists", {
      projectId: project,
      name: "Chores",
      favorite: false,
      createdBy: user,
      updatedAt: 1,
    });
    const item = await ctx.db.insert("listItems", {
      listId: list,
      name: "New name from teammate",
      completed: false,
      createdBy: user,
      updatedAt: 2,
      priority: "high",
      assigneeId: user,
      details: "New details",
      dueAt: 123,
    });
    return { user, outsider, item };
  });
  return {
    t,
    ...ids,
    alice: t.withIdentity({ subject: `${ids.user}|session` }),
  };
}

it("checkbox and category commands preserve fields edited by a teammate", async () => {
  const { t, alice, item, user } = await setup();
  await alice.mutation(api.listItems.setCompleted, {
    itemId: item,
    completed: true,
    expectedDueAt: null,
  });
  await alice.mutation(api.listItems.setCategory, {
    itemId: item,
    category: "Kitchen",
  });
  expect(await t.run((ctx) => ctx.db.get(item))).toMatchObject({
    name: "New name from teammate",
    details: "New details",
    assigneeId: user,
    priority: "high",
    dueAt: 123,
    completed: true,
    category: "Kitchen",
  });
});

it("does not advance a recurring occurrence again when the command is replayed", async () => {
  const { t, alice, item } = await setup();
  const dueAt = Date.now() + 86_400_000;
  await t.run((ctx) =>
    ctx.db.patch(item, { dueAt, recurrence: { freq: "daily", interval: 1 } }),
  );
  const command = { itemId: item, completed: true, expectedDueAt: dueAt };
  await alice.mutation(api.listItems.setCompleted, command);
  const first = await t.run((ctx) => ctx.db.get(item));
  await alice.mutation(api.listItems.setCompleted, command);
  expect(await t.run((ctx) => ctx.db.get(item))).toEqual(first);
  expect(first).toMatchObject({ completed: false, dueAt: dueAt + 86_400_000 });
});

it("gates both commands by project membership", async () => {
  const { t, outsider, item } = await setup();
  const bob = t.withIdentity({ subject: `${outsider}|session` });
  await expect(
    bob.mutation(api.listItems.setCompleted, {
      itemId: item,
      completed: true,
      expectedDueAt: null,
    }),
  ).rejects.toThrow("Project not found");
  await expect(
    bob.mutation(api.listItems.setCategory, { itemId: item, category: null }),
  ).rejects.toThrow("Project not found");
});
