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
    });
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
});
