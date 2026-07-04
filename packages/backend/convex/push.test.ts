import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

function setup() {
  return convexTest(schema, modules);
}

type Ctx = {
  t: ReturnType<typeof setup>;
  alice: Id<"users">;
  bob: Id<"users">;
  family: Id<"projects">;
};

async function seed(): Promise<Ctx> {
  const t = setup();
  const { alice, bob, family } = await t.run(async (ctx) => {
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
    const family = await ctx.db.insert("projects", {
      name: "Family",
      createdBy: alice,
      inviteToken: "tok",
      color: "blue",
    });
    await ctx.db.insert("projectMembers", { projectId: family, userId: alice });
    await ctx.db.insert("projectMembers", { projectId: family, userId: bob });
    return { alice, bob, family };
  });
  return { t, alice, bob, family };
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pushTokens.register / unregister", () => {
  let ctx: Ctx;
  beforeEach(async () => {
    ctx = await seed();
  });

  it("registers a token once and is idempotent", async () => {
    const asBob = ctx.t.withIdentity({ subject: `${ctx.bob}|session` });
    await asBob.mutation(api.pushTokens.register, {
      token: "ExpoToken[bob]",
      platform: "ios",
    });
    await asBob.mutation(api.pushTokens.register, {
      token: "ExpoToken[bob]",
      platform: "ios",
    });
    const rows = await ctx.t.run((c) =>
      c.db
        .query("pushTokens")
        .withIndex("by_token", (q) => q.eq("token", "ExpoToken[bob]"))
        .collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe(ctx.bob);
  });

  it("reassigns a token when a different user signs in on the device", async () => {
    const asBob = ctx.t.withIdentity({ subject: `${ctx.bob}|session` });
    const asAlice = ctx.t.withIdentity({ subject: `${ctx.alice}|session` });
    await asBob.mutation(api.pushTokens.register, { token: "shared" });
    await asAlice.mutation(api.pushTokens.register, { token: "shared" });
    const rows = await ctx.t.run((c) =>
      c.db
        .query("pushTokens")
        .withIndex("by_token", (q) => q.eq("token", "shared"))
        .collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe(ctx.alice);
  });

  it("keeps a separate row per device for the same user", async () => {
    const asBob = ctx.t.withIdentity({ subject: `${ctx.bob}|session` });
    await asBob.mutation(api.pushTokens.register, {
      token: "ExpoToken[bob-phone]",
      platform: "android",
    });
    await asBob.mutation(api.pushTokens.register, {
      token: "ExpoToken[bob-ipad]",
      platform: "ios",
    });
    const rows = await ctx.t.run((c) =>
      c.db
        .query("pushTokens")
        .withIndex("by_user", (q) => q.eq("userId", ctx.bob))
        .collect(),
    );
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.platform).sort()).toEqual(["android", "ios"]);
  });

  it("unregister only removes the caller's own token", async () => {
    const asBob = ctx.t.withIdentity({ subject: `${ctx.bob}|session` });
    const asAlice = ctx.t.withIdentity({ subject: `${ctx.alice}|session` });
    await asBob.mutation(api.pushTokens.register, { token: "bobtoken" });
    // Alice can't drop Bob's token.
    await asAlice.mutation(api.pushTokens.unregister, { token: "bobtoken" });
    expect(
      await ctx.t.run((c) =>
        c.db
          .query("pushTokens")
          .withIndex("by_token", (q) => q.eq("token", "bobtoken"))
          .unique(),
      ),
    ).not.toBeNull();
    // Bob can.
    await asBob.mutation(api.pushTokens.unregister, { token: "bobtoken" });
    expect(
      await ctx.t.run((c) =>
        c.db
          .query("pushTokens")
          .withIndex("by_token", (q) => q.eq("token", "bobtoken"))
          .unique(),
      ),
    ).toBeNull();
  });
});

describe("push.sendToProject", () => {
  let ctx: Ctx;
  beforeEach(async () => {
    ctx = await seed();
    await ctx.t.run(async (c) => {
      await c.db.insert("pushTokens", {
        userId: ctx.bob,
        token: "ExpoToken[bob]",
      });
    });
  });

  it("sends to other members, excludes the actor, and localizes per recipient", async () => {
    const fetchMock = stubExpo();
    await ctx.t.action(internal.push.sendToProject, {
      projectId: ctx.family,
      actorId: ctx.alice,
      bodyKey: "list_created",
      bodyParams: { name: "Groceries" },
      path: `/${ctx.family}/lists`,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(init?.body as string);
    expect(body).toHaveLength(1); // bob only, not alice (the actor)
    expect(body[0]).toMatchObject({
      to: "ExpoToken[bob]",
      title: "Family",
      body: "Nueva lista: Groceries", // bob's locale is "es"
      data: { path: `/${ctx.family}/lists` },
      channelId: "lists",
    });
  });

  it("delivers to every device a member has registered", async () => {
    const fetchMock = stubExpo({ data: [{ status: "ok" }, { status: "ok" }] });
    await ctx.t.run(async (c) => {
      await c.db.insert("pushTokens", {
        userId: ctx.bob,
        token: "ExpoToken[bob-ipad]",
        platform: "ios",
      });
    });
    await ctx.t.action(internal.push.sendToProject, {
      projectId: ctx.family,
      actorId: ctx.alice,
      bodyKey: "list_created",
      bodyParams: { name: "Groceries" },
      path: `/${ctx.family}/lists`,
    });
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body).toHaveLength(2);
    expect(body.map((m: { to: string }) => m.to).sort()).toEqual(
      ["ExpoToken[bob]", "ExpoToken[bob-ipad]"].sort(),
    );
  });

  // The Android channel is derived from the bodyKey's section so each category
  // is mutable on its own; a typo'd map entry would land the push in the wrong
  // (or no) channel. iOS ignores channelId, so this is safe for every recipient.
  it.each([
    ["event_created", "events"],
    ["spending_created", "expenses"],
    ["spending_created_with_description", "expenses"],
    ["member_joined", "members"],
    ["file_uploaded", "files"],
  ])("routes %s to the %s channel", async (bodyKey, channelId) => {
    const fetchMock = stubExpo();
    await ctx.t.action(internal.push.sendToProject, {
      projectId: ctx.family,
      actorId: ctx.alice,
      bodyKey,
      bodyParams: {
        name: "X",
        amount: "1",
        userName: "Carol",
        description: "D",
      },
      path: `/${ctx.family}/home`,
    });
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body[0]).toMatchObject({ channelId });
  });

  it("does not call Expo when there are no recipient tokens", async () => {
    const fetchMock = stubExpo();
    // Bob is the only other member; drop his token.
    await ctx.t.run(async (c) => {
      const row = await c.db
        .query("pushTokens")
        .withIndex("by_token", (q) => q.eq("token", "ExpoToken[bob]"))
        .unique();
      if (row) await c.db.delete(row._id);
    });
    await ctx.t.action(internal.push.sendToProject, {
      projectId: ctx.family,
      actorId: ctx.alice,
      bodyKey: "note_created",
      bodyParams: { name: "X" },
      path: `/${ctx.family}/notes`,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("prunes tokens Expo reports as DeviceNotRegistered", async () => {
    stubExpo({
      data: [{ status: "error", details: { error: "DeviceNotRegistered" } }],
    });
    await ctx.t.action(internal.push.sendToProject, {
      projectId: ctx.family,
      actorId: ctx.alice,
      bodyKey: "list_created",
      bodyParams: { name: "Groceries" },
      path: `/${ctx.family}/lists`,
    });
    const row = await ctx.t.run((c) =>
      c.db
        .query("pushTokens")
        .withIndex("by_token", (q) => q.eq("token", "ExpoToken[bob]"))
        .unique(),
    );
    expect(row).toBeNull();
  });

  // Guards the four notification types added for PWA parity: a typo'd bodyKey or
  // a missing locale entry in pushI18n would surface here as an empty/wrong body.
  it.each([
    ["template_created", { name: "Camping" }, "Nueva plantilla: Camping"],
    ["file_uploaded", { name: "photo.jpg" }, "Archivo photo.jpg añadido"],
    ["member_joined", { userName: "Carol" }, "Carol se ha unido al grupo"],
    ["member_left", { userName: "Carol" }, "Carol ha dejado el grupo"],
  ])("localizes %s for the recipient", async (bodyKey, bodyParams, expected) => {
    const fetchMock = stubExpo();
    await ctx.t.action(internal.push.sendToProject, {
      projectId: ctx.family,
      actorId: ctx.alice,
      bodyKey,
      bodyParams,
      path: `/${ctx.family}/lists`,
    });
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body[0]).toMatchObject({ to: "ExpoToken[bob]", body: expected });
  });
});
