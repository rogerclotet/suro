import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", { name: "Alice" });
    const bob = await ctx.db.insert("users", { name: "Bob" });
    const group = await ctx.db.insert("projects", {
      name: "Older group",
      createdBy: alice,
      color: "blue",
      inviteToken: "old",
      lastActivityAt: 1,
    });
    const newer = await ctx.db.insert("projects", {
      name: "Newer group",
      createdBy: alice,
      color: "blue",
      inviteToken: "new",
      lastActivityAt: 2,
    });
    for (const projectId of [group, newer]) {
      for (const userId of [alice, bob]) {
        await ctx.db.insert("projectMembers", { projectId, userId });
      }
    }
    const list = await ctx.db.insert("lists", {
      projectId: group,
      name: "Shopping",
      favorite: false,
      createdBy: alice,
      updatedAt: 1,
    });
    const item = await ctx.db.insert("listItems", {
      listId: list,
      name: "Milk",
      completed: false,
      createdBy: alice,
      updatedAt: 1,
    });
    const note = await ctx.db.insert("notes", {
      projectId: group,
      name: "Note",
      contents: "",
      format: "plain",
      createdBy: alice,
      updatedAt: 1,
    });
    const editLockId = await ctx.db.insert("noteEditLocks", {
      noteId: note,
      userId: bob,
      expiresAt: Date.now() + 60_000,
    });
    const event = await ctx.db.insert("events", {
      projectId: group,
      name: "Dinner",
      startAt: 1,
      endAt: 2,
      allDay: false,
      createdBy: alice,
      updatedAt: 1,
    });
    const pot = await ctx.db.insert("pots", {
      projectId: group,
      name: "Trip",
      createdBy: alice,
    });
    for (const userId of [alice, bob])
      await ctx.db.insert("potMembers", { potId: pot, userId });
    const template = await ctx.db.insert("listTemplates", {
      projectId: group,
      name: "Weekly shop",
      items: [{ name: "Apples", category: null }],
      createdBy: alice,
      updatedAt: 1,
    });
    const storageId = await ctx.storage.store(new Blob(["File"]));
    const file = await ctx.db.insert("files", {
      projectId: group,
      name: "File",
      storageId,
      type: "text/plain",
      size: 4,
      uploadedBy: bob,
    });
    return {
      alice,
      bob,
      group,
      newer,
      list,
      item,
      note,
      editLockId,
      event,
      pot,
      file,
      template,
    };
  });
  return {
    t,
    ...ids,
    actor: t.withIdentity({ subject: `${ids.bob}|session` }),
    viewer: t.withIdentity({ subject: `${ids.alice}|session` }),
  };
}

type Fixture = Awaited<ReturnType<typeof setup>>;
const changes: { name: string; run: (f: Fixture) => Promise<unknown> }[] = [
  {
    name: "add an unassigned list item",
    run: (f) =>
      f.actor.mutation(api.listItems.create, { listId: f.list, name: "Bread" }),
  },
  {
    name: "check off an item",
    run: (f) =>
      f.actor.mutation(api.listItems.setCompleted, {
        itemId: f.item,
        completed: true,
        expectedDueAt: null,
      }),
  },
  {
    name: "edit an item from an installed client",
    run: (f) =>
      f.actor.mutation(api.listItems.update, {
        itemId: f.item,
        name: "Oat milk",
        completed: true,
      }),
  },
  {
    name: "categorize an item",
    run: (f) =>
      f.actor.mutation(api.listItems.setCategory, {
        itemId: f.item,
        category: "Dairy",
      }),
  },
  {
    name: "delete an item",
    run: (f) => f.actor.mutation(api.listItems.remove, { itemId: f.item }),
  },
  {
    name: "edit a list",
    run: (f) =>
      f.actor.mutation(api.lists.update, { listId: f.list, name: "Groceries" }),
  },
  {
    name: "favorite a list",
    run: (f) => f.actor.mutation(api.lists.toggleFavorite, { listId: f.list }),
  },
  {
    name: "delete a list",
    run: (f) => f.actor.mutation(api.lists.remove, { listId: f.list }),
  },
  {
    name: "clear completed items",
    run: async (f) => {
      await f.t.run((ctx) => ctx.db.patch(f.item, { completed: true }));
      return f.actor.mutation(api.lists.clearCompleted, { listId: f.list });
    },
  },
  {
    name: "edit a note",
    run: (f) =>
      f.actor.mutation(api.notes.update, {
        noteId: f.note,
        name: "Note",
        contents: "Updated",
        editLockId: f.editLockId,
      }),
  },
  {
    name: "delete a note",
    run: (f) => f.actor.mutation(api.notes.remove, { noteId: f.note }),
  },
  {
    name: "edit an event",
    run: (f) =>
      f.actor.mutation(api.events.update, {
        eventId: f.event,
        name: "Lunch",
        startAt: 3,
        endAt: 4,
        allDay: false,
      }),
  },
  {
    name: "delete an event",
    run: (f) => f.actor.mutation(api.events.remove, { eventId: f.event }),
  },
  {
    name: "create a linked list",
    run: (f) =>
      f.actor.mutation(api.events.createLinkedList, { eventId: f.event }),
  },
  {
    name: "create a linked note",
    run: (f) =>
      f.actor.mutation(api.events.createLinkedNote, { eventId: f.event }),
  },
  {
    name: "create a linked pot",
    run: (f) =>
      f.actor.mutation(api.events.createLinkedPot, { eventId: f.event }),
  },
  {
    name: "link a list",
    run: (f) =>
      f.actor.mutation(api.events.linkList, {
        eventId: f.event,
        listId: f.list,
      }),
  },
  {
    name: "link a note",
    run: (f) =>
      f.actor.mutation(api.events.linkNote, {
        eventId: f.event,
        noteId: f.note,
      }),
  },
  {
    name: "link a pot",
    run: (f) =>
      f.actor.mutation(api.events.linkPot, { eventId: f.event, potId: f.pot }),
  },
  {
    name: "settle a pot",
    run: (f) =>
      f.actor.mutation(api.expenses.settlePayments, {
        potId: f.pot,
        payments: [],
      }),
  },
  {
    name: "delete a pot",
    run: (f) => f.actor.mutation(api.expenses.deletePot, { potId: f.pot }),
  },
  {
    name: "rename a file",
    run: (f) =>
      f.actor.mutation(api.files.rename, { fileId: f.file, name: "Renamed" }),
  },
  {
    name: "delete a file",
    run: (f) => f.actor.mutation(api.files.remove, { fileId: f.file }),
  },
  {
    name: "import template items",
    run: (f) =>
      f.actor.mutation(api.lists.importTemplates, {
        listId: f.list,
        templateIds: [f.template],
      }),
  },
  {
    name: "edit a template",
    run: (f) =>
      f.actor.mutation(api.templates.update, {
        templateId: f.template,
        name: "Daily shop",
        items: [],
      }),
  },
  {
    name: "delete a template",
    run: (f) =>
      f.actor.mutation(api.templates.remove, { templateId: f.template }),
  },
  {
    name: "unlink a list",
    run: async (f) => {
      await f.t.run((ctx) => ctx.db.patch(f.list, { eventId: f.event }));
      return f.actor.mutation(api.events.unlinkList, {
        eventId: f.event,
        listId: f.list,
      });
    },
  },
  {
    name: "unlink a note",
    run: async (f) => {
      await f.t.run((ctx) => ctx.db.patch(f.note, { eventId: f.event }));
      return f.actor.mutation(api.events.unlinkNote, {
        eventId: f.event,
        noteId: f.note,
      });
    },
  },
  {
    name: "unlink a pot",
    run: async (f) => {
      await f.t.run((ctx) => ctx.db.patch(f.pot, { eventId: f.event }));
      return f.actor.mutation(api.events.unlinkPot, {
        eventId: f.event,
        potId: f.pot,
      });
    },
  },
];

describe("group activity from quiet content changes", () => {
  it.each(changes)(
    "promotes the group when a teammate chooses to $name, without notifying",
    async ({ run }) => {
      const f = await setup();
      const order = async () =>
        (await f.viewer.query(api.projects.listMineDetailed, {})).map(
          (group) => group._id,
        );
      expect(await order()).toEqual([f.newer, f.group]);
      await run(f);
      expect(await order()).toEqual([f.group, f.newer]);
      expect(await f.viewer.query(api.notifications.unread, {})).toEqual([]);
    },
  );

  it("records template exports in the destination group only", async () => {
    const f = await setup();
    await f.actor.mutation(api.templates.exportToProject, {
      templateId: f.template,
      targetProjectId: f.newer,
    });
    expect(await f.t.run((ctx) => ctx.db.get(f.group))).toMatchObject({
      lastActivityAt: 1,
    });
    const destination = await f.t.run((ctx) => ctx.db.get(f.newer));
    expect(destination?.lastActivityAt).toBeGreaterThan(2);
  });

  it("keeps activity unchanged for reads and replayed checkbox commands", async () => {
    const f = await setup();
    await f.actor.query(api.lists.get, { listId: f.list });
    await f.actor.mutation(api.lists.clearCompleted, { listId: f.list });
    await f.actor.mutation(api.lists.importTemplates, {
      listId: f.list,
      templateIds: [],
    });
    expect(await f.t.run((ctx) => ctx.db.get(f.group))).toMatchObject({
      lastActivityAt: 1,
    });
    await f.actor.mutation(api.listItems.setCompleted, {
      itemId: f.item,
      completed: false,
      expectedDueAt: null,
    });
    expect(await f.t.run((ctx) => ctx.db.get(f.group))).toMatchObject({
      lastActivityAt: 1,
    });
  });
});
