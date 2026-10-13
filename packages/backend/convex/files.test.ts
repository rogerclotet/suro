import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
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
    });
    const other = await ctx.db.insert("projects", {
      name: "Other",
      createdBy: bob,
      inviteToken: "token-other",
      color: "red",
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

  it("returns [] (not an error) when the event no longer exists", async () => {
    // The detail screen keeps this query subscribed while it navigates away
    // after deleting the event; it must resolve to [] rather than throwing
    // "Event not found" and surfacing a Convex error on the client.
    const eventId = await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Trip",
      startAt: Date.now(),
      endAt: Date.now() + 3600_000,
      allDay: false,
    });
    await saveFamilyFile("Map", { eventId });
    await alice.mutation(api.events.remove, { eventId });

    await expect(
      alice.query(api.files.listByEvent, { eventId }),
    ).resolves.toEqual([]);
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

describe("files: PDF thumbnails", () => {
  it("exposes a thumbnailUrl once a thumbnail is attached", async () => {
    const fileId = await saveFamilyFile("Doc");
    expect(
      (await alice.query(api.files.listByProject, { projectId: ids.family }))[0]
        ?.thumbnailUrl,
    ).toBeNull();

    const thumbId = await storeBlob("png-bytes");
    await t.mutation(internal.files.attachThumbnail, {
      fileId,
      thumbnailStorageId: thumbId,
    });

    const files = await alice.query(api.files.listByProject, {
      projectId: ids.family,
    });
    expect(files[0]?.thumbnailUrl).toBeTruthy();
  });

  it("drops the orphan blob when its file is already gone", async () => {
    const fileId = await saveFamilyFile("Vanishing");
    await alice.mutation(api.files.remove, { fileId });

    const thumbId = await storeBlob("png-bytes");
    await t.mutation(internal.files.attachThumbnail, {
      fileId,
      thumbnailStorageId: thumbId,
    });

    const stillThere = await t.run((ctx) => ctx.storage.getUrl(thumbId));
    expect(stillThere).toBeNull();
  });

  it("deletes the thumbnail blob when the file is removed", async () => {
    const fileId = await saveFamilyFile("WithThumb");
    const thumbId = await storeBlob("png-bytes");
    await t.mutation(internal.files.attachThumbnail, {
      fileId,
      thumbnailStorageId: thumbId,
    });

    await alice.mutation(api.files.remove, { fileId });

    const stillThere = await t.run((ctx) => ctx.storage.getUrl(thumbId));
    expect(stillThere).toBeNull();
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

describe("files: blob ownership", () => {
  /** A file alice uploaded to Family, with bob able to see its storage id. */
  async function aliceFileSeenByBob() {
    const fileId = await saveFamilyFile("Receipt");
    const storageId = await t.run(async (ctx) => {
      const file = await ctx.db.get(fileId);
      if (file === null) throw new Error("fixture file missing");
      return file.storageId;
    });
    return { fileId, storageId };
  }

  function blobExists(storageId: Id<"_storage">) {
    return t.run(async (ctx) => (await ctx.storage.get(storageId)) !== null);
  }

  it("records the stored blob's size instead of the client's claim", async () => {
    const storageId = await storeBlob("hello world");
    await alice.mutation(api.files.saveFile, {
      projectId: ids.family,
      storageId,
      name: "Notes",
      type: "text/plain",
      size: 0,
    });
    const files = await alice.query(api.files.listByProject, {
      projectId: ids.family,
    });
    expect(files[0]?.size).toBe(11);
  });

  it("rejects a storage id with no stored blob", async () => {
    const storageId = await storeBlob();
    await t.run((ctx) => ctx.storage.delete(storageId));
    await expect(
      alice.mutation(api.files.saveFile, {
        projectId: ids.family,
        storageId,
        name: "Ghost",
        type: "image/png",
        size: 5,
      }),
    ).rejects.toThrow("Uploaded file not found");
  });

  it("stops another user adopting a file's blob to delete it", async () => {
    const { storageId } = await aliceFileSeenByBob();

    // Bob re-registers alice's blob in his own group so he would own a row
    // whose removal deletes it.
    await expect(
      bob.mutation(api.files.saveFile, {
        projectId: ids.other,
        storageId,
        name: "Mine now",
        type: "image/png",
        size: 5,
      }),
    ).rejects.toThrow("Uploaded file not found");
    expect(await blobExists(storageId)).toBe(true);
  });

  it("stops another user adopting a file's blob as their avatar or group image", async () => {
    const { storageId } = await aliceFileSeenByBob();

    await expect(
      bob.mutation(api.users.setAvatarImage, { storageId }),
    ).rejects.toThrow("Uploaded file not found");
    await expect(
      bob.mutation(api.projects.setImage, { projectId: ids.other, storageId }),
    ).rejects.toThrow("Uploaded file not found");

    // The follow-up "remove" calls that used to delete the adopted blob.
    await bob.mutation(api.users.removeAvatarImage, {});
    await bob.mutation(api.projects.removeImage, { projectId: ids.other });
    expect(await blobExists(storageId)).toBe(true);
  });

  it("stops another user adopting someone's avatar or a group image", async () => {
    const avatar = await storeBlob("avatar");
    const groupImage = await storeBlob("group");
    await alice.mutation(api.users.setAvatarImage, { storageId: avatar });
    await alice.mutation(api.projects.setImage, {
      projectId: ids.family,
      storageId: groupImage,
    });

    for (const storageId of [avatar, groupImage]) {
      await expect(
        bob.mutation(api.users.setAvatarImage, { storageId }),
      ).rejects.toThrow("Uploaded file not found");
      await expect(
        bob.mutation(api.files.saveFile, {
          projectId: ids.other,
          storageId,
          name: "Stolen",
          type: "image/png",
          size: 5,
        }),
      ).rejects.toThrow("Uploaded file not found");
      expect(await blobExists(storageId)).toBe(true);
    }
  });

  it("stops a PDF thumbnail's blob being adopted", async () => {
    const fileId = await saveFamilyFile("Contract");
    const thumbnailStorageId = await storeBlob("thumb");
    await t.mutation(internal.files.attachThumbnail, {
      fileId,
      thumbnailStorageId,
    });

    await expect(
      bob.mutation(api.users.setAvatarImage, { storageId: thumbnailStorageId }),
    ).rejects.toThrow("Uploaded file not found");
    expect(await blobExists(thumbnailStorageId)).toBe(true);
  });

  it("keeps the avatar and group image when the same upload is saved twice", async () => {
    const avatar = await storeBlob("avatar");
    const groupImage = await storeBlob("group");
    for (let attempt = 0; attempt < 2; attempt++) {
      await alice.mutation(api.users.setAvatarImage, { storageId: avatar });
      await alice.mutation(api.projects.setImage, {
        projectId: ids.family,
        storageId: groupImage,
      });
    }
    expect(await blobExists(avatar)).toBe(true);
    expect(await blobExists(groupImage)).toBe(true);
  });

  it("still replaces an avatar with a fresh upload and deletes the old blob", async () => {
    const first = await storeBlob("first");
    const second = await storeBlob("second");
    await alice.mutation(api.users.setAvatarImage, { storageId: first });
    await alice.mutation(api.users.setAvatarImage, { storageId: second });

    expect(await blobExists(first)).toBe(false);
    expect(await blobExists(second)).toBe(true);
  });
});
