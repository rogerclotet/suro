import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { sha256Hex } from "./reviewOtp";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

function setup() {
  return convexTest(schema, modules);
}

let t: ReturnType<typeof setup>;
let userId: Id<"users">;
let alice: ReturnType<ReturnType<typeof setup>["withIdentity"]>;

beforeEach(async () => {
  t = setup();
  userId = await t.run((ctx) =>
    ctx.db.insert("users", { name: "Alice", email: "alice@example.test" }),
  );
  alice = t.withIdentity({ subject: `${userId}|session` });
});

function redeem(secret: string) {
  return t.mutation(internal.watchPairings.redeemTicket, {
    secretHash: sha256Hex(secret),
  });
}

describe("watch pairing tickets", () => {
  it("mints a ticket that redeems to the minting user", async () => {
    const { secret } = await alice.mutation(api.watchPairings.createTicket, {});
    expect(secret).not.toBe("");
    await expect(redeem(secret)).resolves.toBe(userId);
  });

  it("stores only the hash, never the secret", async () => {
    const { secret } = await alice.mutation(api.watchPairings.createTicket, {});
    const rows = await t.run((ctx) => ctx.db.query("watchPairings").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.secretHash).toBe(sha256Hex(secret));
    expect(JSON.stringify(rows)).not.toContain(secret);
  });

  it("refuses a replayed secret", async () => {
    const { secret } = await alice.mutation(api.watchPairings.createTicket, {});
    await redeem(secret);
    await expect(redeem(secret)).rejects.toThrow(
      "Invalid watch pairing ticket",
    );
  });

  it("refuses an expired ticket", async () => {
    const { secret } = await alice.mutation(api.watchPairings.createTicket, {});
    await t.run(async (ctx) => {
      const ticket = await ctx.db.query("watchPairings").first();
      if (ticket === null) {
        throw new Error("expected a ticket");
      }
      await ctx.db.patch(ticket._id, { expiresAt: Date.now() - 1 });
    });

    await expect(redeem(secret)).rejects.toThrow("has expired");
    // The throw rolls the delete back with the rest of the transaction, so the
    // row outlives the attempt — it just can never redeem, and `pruneExpired`
    // clears it out.
    await expect(redeem(secret)).rejects.toThrow("has expired");
  });

  it("refuses a secret that was never minted", async () => {
    await expect(redeem("not-a-real-secret")).rejects.toThrow(
      "Invalid watch pairing ticket",
    );
  });

  it("invalidates the previous ticket when re-minting", async () => {
    const first = await alice.mutation(api.watchPairings.createTicket, {});
    const second = await alice.mutation(api.watchPairings.createTicket, {});

    await expect(redeem(first.secret)).rejects.toThrow(
      "Invalid watch pairing ticket",
    );
    await expect(redeem(second.secret)).resolves.toBe(userId);
  });

  it("requires a signed-in caller", async () => {
    await expect(
      t.mutation(api.watchPairings.createTicket, {}),
    ).rejects.toThrow("Not logged in");
  });

  it("prunes only expired tickets", async () => {
    const live = await alice.mutation(api.watchPairings.createTicket, {});
    const staleUser = await t.run((ctx) =>
      ctx.db.insert("users", { name: "Bob", email: "bob@example.test" }),
    );
    await t.run((ctx) =>
      ctx.db.insert("watchPairings", {
        userId: staleUser,
        secretHash: sha256Hex("stale"),
        expiresAt: Date.now() - 1,
      }),
    );

    expect(await t.mutation(internal.watchPairings.pruneExpired, {})).toBe(1);
    await expect(redeem(live.secret)).resolves.toBe(userId);
  });
});
