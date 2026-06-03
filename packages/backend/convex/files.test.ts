import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

type Ids = {
  alice: Id<"users">;
  bob: Id<"users">;
  family: Id<"projects">;
  other: Id<"projects">;
};

function setup() {
  return convexTest(schema, modules);
}

async function seed(t: ReturnType<typeof setup>): Promise<Ids> {
  return t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", {
      name: "Alice",
      email: "alice@example.test",
    });
    const bob = await ctx.db.insert("users", {
      name: "Bob",
      email: "bob@example.test",
    });
    const family = await ctx.db.insert("projects", {
      name: "Family",
      createdBy: alice,
      inviteToken: "token-family",
      color: "blue",
      features: { secretSanta: false },
    });
    const other = await ctx.db.insert("projects", {
      name: "Other",
      createdBy: bob,
      inviteToken: "token-other",
      color: "red",
      features: { secretSanta: false },
    });
    await ctx.db.insert("projectMembers", { projectId: family, userId: alice });
    await ctx.db.insert("projectMembers", { projectId: other, userId: bob });
    return { alice, bob, family, other };
  });
}

let t: ReturnType<typeof setup>;
let ids: Ids;
let alice: ReturnType<ReturnType<typeof setup>["withIdentity"]>;
let bob: ReturnType<ReturnType<typeof setup>["withIdentity"]>;

beforeEach(async () => {
  t = setup();
  ids = await seed(t);
  alice = t.withIdentity({ subject: `${ids.alice}|session` });
  bob = t.withIdentity({ subject: `${ids.bob}|session` });
});

/** Store a blob directly and return its storage id (stands in for an upload). */
function storeBlob(content = "hello") {
  return t.run((ctx) => ctx.storage.store(new Blob([content])));
}

async function saveFamilyFile(
  name = "photo",
  over: { eventId?: Id<"events"> } = {},
) {
  const storageId = await storeBlob();
  return alice.mutation(api.files.saveFile, {
    projectId: ids.family,
    storageId,
    name,
    type: "image/png",
    size: 5,
    eventId: over.eventId,
  });
}

describe("files: upload + listing", () => {
  it("requires membership to get an upload URL", async () => {
    await expect(
      alice.mutation(api.files.generateUploadUrl, { projectId: ids.family }),
    ).resolves.toBeTypeOf("string");
    await expect(
      bob.mutation(api.files.generateUploadUrl, { projectId: ids.family }),
    ).rejects.toThrow();
  });

  it("saves a file (trimming the name) and lists it with a url + uploader", async () => {
    await saveFamilyFile("  Beach  ");
    const files = await alice.query(api.files.listByProject, {
      projectId: ids.family,
    });
    expect(files).toHaveLength(1);
    expect(files[0]?.name).toBe("Beach");
    expect(files[0]?.uploaderName).toBe("Alice");
    expect(files[0]?.url).toBeTruthy();
  });

  it("lists newest first", async () => {
    await saveFamilyFile("First");
    await saveFamilyFile("Second");
    const files = await alice.query(api.files.listByProject, {
      projectId: ids.family,
    });
    expect(files.map((f) => f.name)).toEqual(["Second", "First"]);
  });

  it("rejects non-members from listing", async () => {
    await saveFamilyFile();
    await expect(
      bob.query(api.files.listByProject, { projectId: ids.family }),
    ).rejects.toThrow();
  });
});

describe("files: event attachment", () => {
  it("attaches a file to an event and lists it by event", async () => {
    const eventId = await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Trip",
      startAt: Date.now(),
      endAt: Date.now() + 3600_000,
      allDay: false,
    });
    await saveFamilyFile("Map", { eventId });

    const byEvent = await alice.query(api.files.listByEvent, { eventId });
    expect(byEvent.map((f) => f.name)).toEqual(["Map"]);
  });

  it("detaches files (keeps them) when their event is deleted", async () => {
    const eventId = await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Trip",
      startAt: Date.now(),
      endAt: Date.now() + 3600_000,
      allDay: false,
    });
    await saveFamilyFile("Map", { eventId });
    await alice.mutation(api.events.remove, { eventId });

    const files = await alice.query(api.files.listByProject, {
      projectId: ids.family,
    });
    expect(files).toHaveLength(1);
    expect(files[0]?.eventId).toBeUndefined();
  });

  it("rejects attaching to an event from another project", async () => {
    const foreignEvent = await t.run((ctx) =>
      ctx.db.insert("events", {
        name: "Theirs",
        startAt: Date.now(),
        endAt: Date.now() + 1,
        allDay: false,
        projectId: ids.other,
        createdBy: ids.bob,
        updatedAt: Date.now(),
      }),
    );
    const storageId = await storeBlob();
    await expect(
      alice.mutation(api.files.saveFile, {
        projectId: ids.family,
        storageId,
        name: "x",
        type: "image/png",
        size: 5,
        eventId: foreignEvent,
      }),
    ).rejects.toThrow();
  });
});

describe("files: owner-only rename + delete", () => {
  it("lets the owner rename, but not other members", async () => {
    const fileId = await saveFamilyFile("Old");
    // Make bob a family member so the rejection is owner-based, not membership.
    await t.run((ctx) =>
      ctx.db.insert("projectMembers", {
        projectId: ids.family,
        userId: ids.bob,
      }),
    );

    await expect(
      bob.mutation(api.files.rename, { fileId, name: "Hacked" }),
    ).rejects.toThrow("File not found");

    await alice.mutation(api.files.rename, { fileId, name: "New" });
    const files = await alice.query(api.files.listByProject, {
      projectId: ids.family,
    });
    expect(files[0]?.name).toBe("New");
  });

  it("lets the owner delete (removing the row and the blob)", async () => {
    const fileId = await saveFamilyFile("Doomed");
    const storageId = await t.run(async (ctx) => {
      const file = await ctx.db.get(fileId);
      return file?.storageId ?? null;
    });

    await alice.mutation(api.files.remove, { fileId });
    const files = await alice.query(api.files.listByProject, {
      projectId: ids.family,
    });
    expect(files).toHaveLength(0);
    // The underlying blob is gone too.
    const stillThere = await t.run(async (ctx) =>
      storageId ? await ctx.storage.getUrl(storageId) : null,
    );
    expect(stillThere).toBeNull();
  });
});
