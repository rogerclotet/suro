import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const aliceId = await ctx.db.insert("users", { name: "Alice" });
    const bobId = await ctx.db.insert("users", { name: "Bob" });
    const outsiderId = await ctx.db.insert("users", { name: "Outsider" });
    const projectId = await ctx.db.insert("projects", {
      name: "Home",
      createdBy: aliceId,
      inviteToken: "home",
      color: "blue",
    });
    await ctx.db.insert("projectMembers", { projectId, userId: aliceId });
    await ctx.db.insert("projectMembers", { projectId, userId: bobId });
    const noteId = await ctx.db.insert("notes", {
      projectId,
      name: "Note",
      contents: "",
      format: "html",
      createdBy: aliceId,
      updatedAt: Date.now(),
    });
    const otherNoteId = await ctx.db.insert("notes", {
      projectId,
      name: "Other",
      contents: "",
      format: "html",
      createdBy: aliceId,
      updatedAt: Date.now(),
    });
    return { aliceId, bobId, outsiderId, noteId, otherNoteId };
  });
  return {
    t,
    ...ids,
    alice: t.withIdentity({ subject: `${ids.aliceId}|session` }),
    bob: t.withIdentity({ subject: `${ids.bobId}|session` }),
    outsider: t.withIdentity({ subject: `${ids.outsiderId}|session` }),
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("rejects saves without an editing lock", async () => {
  const { alice, noteId } = await setup();
  await expect(
    alice.mutation(api.notes.update, {
      noteId,
      name: "Overwrite",
      contents: "Unprotected save",
    }),
  ).rejects.toThrow("editing lock");
});

it("allows one editor, exposes their name, and unlocks after the final save", async () => {
  const { t, alice, bob, noteId, otherNoteId } = await setup();
  const lock = await alice.mutation(api.noteEditLocks.acquire, { noteId });
  if (!lock) throw new Error("Expected an editing lock");
  expect(await bob.query(api.noteEditLocks.get, { noteId })).toEqual({
    editorName: "Alice",
  });
  expect(await bob.mutation(api.noteEditLocks.acquire, { noteId })).toBeNull();
  expect(
    await alice.mutation(api.noteEditLocks.acquire, { noteId }),
  ).toBeNull();
  await expect(
    bob.mutation(api.notes.update, {
      noteId,
      editLockId: lock.lockId,
      name: "Stolen",
      contents: "",
    }),
  ).rejects.toThrow("editing lock");
  await expect(
    alice.mutation(api.notes.update, {
      noteId: otherNoteId,
      editLockId: lock.lockId,
      name: "Wrong note",
      contents: "",
    }),
  ).rejects.toThrow("editing lock");
  expect(
    await bob.mutation(api.noteEditLocks.renew, { lockId: lock.lockId }),
  ).toBeNull();
  await bob.mutation(api.noteEditLocks.release, { lockId: lock.lockId });
  expect(await bob.mutation(api.noteEditLocks.acquire, { noteId })).toBeNull();
  await alice.mutation(api.notes.update, {
    noteId,
    editLockId: lock.lockId,
    name: "Saved",
    contents: "<p>Latest</p>",
  });
  await alice.mutation(api.noteEditLocks.release, { lockId: lock.lockId });
  expect(await bob.query(api.noteEditLocks.get, { noteId })).toBeNull();
  const next = await bob.mutation(api.noteEditLocks.acquire, { noteId });
  expect(next?.note.contents).toBe("<p>Latest</p>");
  await expect(
    alice.mutation(api.notes.update, {
      noteId,
      editLockId: lock.lockId,
      name: "Late save",
      contents: "stale",
    }),
  ).rejects.toThrow("editing lock");
  await alice.mutation(api.noteEditLocks.release, { lockId: lock.lockId });
  expect(await alice.query(api.noteEditLocks.get, { noteId })).toEqual({
    editorName: "Bob",
  });
  await t.finishAllScheduledFunctions(vi.runAllTimers);
});

it("expires abandoned locks with a database update and rejects late heartbeats", async () => {
  const { t, alice, bob, noteId } = await setup();
  const lock = await alice.mutation(api.noteEditLocks.acquire, { noteId });
  if (!lock) throw new Error("Expected an editing lock");
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(await bob.query(api.noteEditLocks.get, { noteId })).toBeNull();
  expect(
    await alice.mutation(api.noteEditLocks.renew, { lockId: lock.lockId }),
  ).toBeNull();
  await expect(
    alice.mutation(api.notes.update, {
      noteId,
      editLockId: lock.lockId,
      name: "Late",
      contents: "stale",
    }),
  ).rejects.toThrow("editing lock");
  expect(
    await bob.mutation(api.noteEditLocks.acquire, { noteId }),
  ).not.toBeNull();
  await t.finishAllScheduledFunctions(vi.runAllTimers);
});

it("keeps renewed leases through their original expiry", async () => {
  const { t, alice, bob, noteId } = await setup();
  const lock = await alice.mutation(api.noteEditLocks.acquire, { noteId });
  if (!lock) throw new Error("Expected an editing lock");
  vi.advanceTimersByTime(30_000);
  const expiresAt = await alice.mutation(api.noteEditLocks.renew, {
    lockId: lock.lockId,
  });
  expect(expiresAt).toBe(lock.expiresAt + 30_000);
  vi.advanceTimersByTime(30_000);
  await t.finishInProgressScheduledFunctions();
  expect(await bob.mutation(api.noteEditLocks.acquire, { noteId })).toBeNull();
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(await bob.query(api.noteEditLocks.get, { noteId })).toBeNull();
});

it("gates lock access by project membership", async () => {
  const { t, alice, outsider, noteId } = await setup();
  const lock = await alice.mutation(api.noteEditLocks.acquire, { noteId });
  if (!lock) throw new Error("Expected an editing lock");
  await expect(
    outsider.query(api.noteEditLocks.get, { noteId }),
  ).rejects.toThrow();
  await expect(
    outsider.mutation(api.noteEditLocks.acquire, { noteId }),
  ).rejects.toThrow();
  await expect(
    outsider.mutation(api.noteEditLocks.renew, { lockId: lock.lockId }),
  ).rejects.toThrow();
  await expect(
    outsider.mutation(api.noteEditLocks.release, { lockId: lock.lockId }),
  ).rejects.toThrow();
  await t.finishAllScheduledFunctions(vi.runAllTimers);
});

it("resolves simultaneous edit requests to a single owner", async () => {
  const { t, alice, bob, noteId } = await setup();
  const results = await Promise.all([
    alice.mutation(api.noteEditLocks.acquire, { noteId }),
    bob.mutation(api.noteEditLocks.acquire, { noteId }),
  ]);
  expect(results.filter((result) => result !== null)).toHaveLength(1);
  await t.finishAllScheduledFunctions(vi.runAllTimers);
});
