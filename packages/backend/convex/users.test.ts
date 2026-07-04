import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

/**
 * Alice owns "Family" (a list + item + a stored file, Bob is also a member) and
 * is also a member of Bob's "BobGroup" where she authored a list. Alice has a
 * push token and a full set of Convex Auth rows.
 */
async function seedAccount() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", { email: "a@x.test" });
    const bob = await ctx.db.insert("users", { email: "b@x.test" });

    const family = await ctx.db.insert("projects", {
      name: "Family",
      createdBy: alice,
      inviteToken: "fam",
      color: "blue",
    });
    await ctx.db.insert("projectMembers", { projectId: family, userId: alice });
    await ctx.db.insert("projectMembers", { projectId: family, userId: bob });
    const familyList = await ctx.db.insert("lists", {
      name: "Groceries",
      projectId: family,
      favorite: false,
      createdBy: alice,
      updatedBy: alice,
      updatedAt: 1,
    });
    await ctx.db.insert("listItems", {
      name: "Milk",
      completed: false,
      listId: familyList,
      createdBy: alice,
      updatedBy: alice,
      updatedAt: 1,
    });
    const storageId = await ctx.storage.store(new Blob(["hello"]));
    const familyFile = await ctx.db.insert("files", {
      name: "photo.jpg",
      storageId,
      type: "image/jpeg",
      size: 5,
      projectId: family,
      uploadedBy: alice,
    });

    // Bob's group, where Alice is a member and authored a list.
    const bobGroup = await ctx.db.insert("projects", {
      name: "BobGroup",
      createdBy: bob,
      inviteToken: "bob",
      color: "red",
    });
    await ctx.db.insert("projectMembers", { projectId: bobGroup, userId: bob });
    await ctx.db.insert("projectMembers", {
      projectId: bobGroup,
      userId: alice,
    });
    const aliceListInBobGroup = await ctx.db.insert("lists", {
      name: "Alice's list",
      projectId: bobGroup,
      favorite: false,
      createdBy: alice,
      updatedBy: alice,
      updatedAt: 1,
    });

    await ctx.db.insert("pushTokens", {
      userId: alice,
      token: "ExponentPushToken[alice]",
    });

    // Convex Auth rows for Alice.
    const account = await ctx.db.insert("authAccounts", {
      userId: alice,
      provider: "google",
      providerAccountId: "alice-google",
    });
    await ctx.db.insert("authVerificationCodes", {
      accountId: account,
      provider: "google",
      code: "123456",
      expirationTime: 9_999_999_999_999,
    });
    const session = await ctx.db.insert("authSessions", {
      userId: alice,
      expirationTime: 9_999_999_999_999,
    });
    await ctx.db.insert("authRefreshTokens", {
      sessionId: session,
      expirationTime: 9_999_999_999_999,
    });

    return {
      alice,
      bob,
      family,
      familyFile,
      storageId,
      bobGroup,
      aliceListInBobGroup,
    };
  });
  return { t, ...ids };
}

describe("users.deleteAccount", () => {
  it("requires authentication", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.users.deleteAccount, {})).rejects.toThrow();
  });

  it("deletes the user, their owned group, memberships, push tokens, and auth rows", async () => {
    const { t, alice, bob, family, storageId, bobGroup } = await seedAccount();
    const asAlice = t.withIdentity({ subject: `${alice}|session` });

    await asAlice.mutation(api.users.deleteAccount, {});

    await t.run(async (ctx) => {
      // The user is gone, Bob survives.
      expect(await ctx.db.get(alice)).toBeNull();
      expect(await ctx.db.get(bob)).not.toBeNull();

      // Owned group and everything scoped to it is gone (incl. Bob's membership).
      expect(await ctx.db.get(family)).toBeNull();
      const familyMembers = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", family))
        .collect();
      expect(familyMembers).toHaveLength(0);
      const familyLists = await ctx.db
        .query("lists")
        .withIndex("by_project", (q) => q.eq("projectId", family))
        .collect();
      expect(familyLists).toHaveLength(0);
      const orphanItems = await ctx.db.query("listItems").collect();
      expect(orphanItems).toHaveLength(0);
      const familyFiles = await ctx.db
        .query("files")
        .withIndex("by_project", (q) => q.eq("projectId", family))
        .collect();
      expect(familyFiles).toHaveLength(0);
      // The stored blob was removed too.
      expect(await ctx.storage.getUrl(storageId)).toBeNull();

      // Alice no longer belongs to anything; Bob's group survives with Bob.
      const aliceMemberships = await ctx.db
        .query("projectMembers")
        .withIndex("by_user", (q) => q.eq("userId", alice))
        .collect();
      expect(aliceMemberships).toHaveLength(0);
      expect(await ctx.db.get(bobGroup)).not.toBeNull();
      const bobGroupMembers = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", bobGroup))
        .collect();
      expect(bobGroupMembers.map((m) => m.userId)).toEqual([bob]);

      // Push tokens and Convex Auth rows for Alice are gone.
      const tokens = await ctx.db
        .query("pushTokens")
        .withIndex("by_user", (q) => q.eq("userId", alice))
        .collect();
      expect(tokens).toHaveLength(0);
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", alice))
        .collect();
      expect(accounts).toHaveLength(0);
      expect(
        await ctx.db.query("authVerificationCodes").collect(),
      ).toHaveLength(0);
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", alice))
        .collect();
      expect(sessions).toHaveLength(0);
      expect(await ctx.db.query("authRefreshTokens").collect()).toHaveLength(0);
    });
  });

  it("leaves the user's content in groups owned by others in place", async () => {
    const { t, alice, aliceListInBobGroup } = await seedAccount();
    const asAlice = t.withIdentity({ subject: `${alice}|session` });

    await asAlice.mutation(api.users.deleteAccount, {});

    // Shared-group content survives for the remaining members, even though its
    // createdBy now points at a deleted user.
    const list = await t.run((ctx) => ctx.db.get(aliceListInBobGroup));
    expect(list).not.toBeNull();
    expect(list?.createdBy).toBe(alice);
  });
});
