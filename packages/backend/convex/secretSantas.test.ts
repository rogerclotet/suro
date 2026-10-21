import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { deleteUserAccount } from "./model/account";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

const EXCHANGE_AT = Date.UTC(2026, 11, 20, 19);
const HOUR = 3_600_000;

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const adminId = await ctx.db.insert("users", { name: "Admin" });
    const annaId = await ctx.db.insert("users", { name: "Anna" });
    const bernatId = await ctx.db.insert("users", { name: "Bernat" });
    const carlaId = await ctx.db.insert("users", { name: "Carla" });
    const outsiderId = await ctx.db.insert("users", { name: "Outsider" });
    const projectId = await ctx.db.insert("projects", {
      name: "Family",
      createdBy: adminId,
      inviteToken: "family",
      color: "blue",
    });
    for (const userId of [adminId, annaId, bernatId, carlaId]) {
      await ctx.db.insert("projectMembers", { projectId, userId });
    }
    return { adminId, annaId, bernatId, carlaId, outsiderId, projectId };
  });
  const as = (userId: Id<"users">) =>
    t.withIdentity({ subject: `${userId}|session` });
  return {
    t,
    ...ids,
    admin: as(ids.adminId),
    anna: as(ids.annaId),
    bernat: as(ids.bernatId),
    carla: as(ids.carlaId),
    outsider: as(ids.outsiderId),
  };
}

type Setup = Awaited<ReturnType<typeof setup>>;

async function createSecretSanta(
  ctx: Setup,
  participantIds = [ctx.annaId, ctx.bernatId, ctx.carlaId, ctx.adminId],
) {
  return ctx.anna.mutation(api.secretSantas.create, {
    projectId: ctx.projectId,
    name: "  Christmas 2026 ",
    description: "Dinner at home",
    exchangeAt: EXCHANGE_AT,
    exchangeAllDay: false,
    priceRange: { min: 10, max: 30 },
    participantIds,
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("create", () => {
  it("creates the Secret Santa with a linked event and notifies participants", async () => {
    const ctx = await setup();
    await createSecretSanta(ctx, [ctx.annaId, ctx.bernatId, ctx.carlaId]);

    const current = await ctx.bernat.query(api.secretSantas.current, {
      projectId: ctx.projectId,
    });
    expect(current).toMatchObject({
      name: "Christmas 2026",
      description: "Dinner at home",
      exchangeAt: EXCHANGE_AT,
      exchangeAllDay: false,
      priceRange: { min: 10, max: 30 },
      drawnAt: null,
      organizerName: "Anna",
      canOrganize: false,
      isParticipant: true,
      assignment: null,
    });
    expect(current?.participants.map((p) => p.name)).toEqual([
      "Anna",
      "Bernat",
      "Carla",
    ]);

    const event = await ctx.t.run((c) =>
      c.db.get(current?.eventId as Id<"events">),
    );
    expect(event).toMatchObject({
      name: "Christmas 2026",
      startAt: EXCHANGE_AT,
      endAt: EXCHANGE_AT + HOUR,
      allDay: false,
    });

    const notified = await ctx.t.run((c) =>
      c.db.query("notifications").collect(),
    );
    expect(notified.map((row) => row.userId).sort()).toEqual(
      [ctx.bernatId, ctx.carlaId].sort(),
    );
    expect(notified[0]?.section).toBe("secretSanta");
  });

  it("allows only one active Secret Santa per group", async () => {
    const ctx = await setup();
    await createSecretSanta(ctx);
    await expect(createSecretSanta(ctx)).rejects.toThrow(
      "already has an active Secret Santa",
    );
  });

  it("requires two participants who belong to the group", async () => {
    const ctx = await setup();
    await expect(createSecretSanta(ctx, [ctx.annaId])).rejects.toThrow(
      "At least two participants",
    );
    await expect(
      createSecretSanta(ctx, [ctx.annaId, ctx.outsiderId]),
    ).rejects.toThrow("not in this group");
  });

  it("is hidden from people outside the group", async () => {
    const ctx = await setup();
    await createSecretSanta(ctx);
    await expect(
      ctx.outsider.query(api.secretSantas.current, {
        projectId: ctx.projectId,
      }),
    ).rejects.toThrow("Project not found");
  });
});

describe("organizing", () => {
  it("lets the creator and the group admin organize, but no one else", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx);
    await expect(
      ctx.bernat.mutation(api.secretSantas.draw, { secretSantaId }),
    ).rejects.toThrow("Only the organizer");

    const asAdmin = await ctx.admin.query(api.secretSantas.current, {
      projectId: ctx.projectId,
    });
    expect(asAdmin?.canOrganize).toBe(true);
    await ctx.admin.mutation(api.secretSantas.draw, { secretSantaId });
  });

  it("keeps the linked event in sync in both directions", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx);
    const later = EXCHANGE_AT + 24 * HOUR;
    await ctx.anna.mutation(api.secretSantas.update, {
      secretSantaId,
      name: "Renamed",
      exchangeAt: later,
      exchangeAllDay: false,
      priceRange: { min: 0, max: 0 },
      participantIds: [ctx.annaId, ctx.bernatId],
    });
    const current = await ctx.anna.query(api.secretSantas.current, {
      projectId: ctx.projectId,
    });
    const eventId = current?.eventId as Id<"events">;
    const event = await ctx.t.run((c) => c.db.get(eventId));
    expect(event).toMatchObject({
      name: "Renamed",
      startAt: later,
      endAt: later + HOUR,
    });
    expect(event).not.toHaveProperty("description");

    const allDayStart = Date.UTC(2026, 11, 24);
    await ctx.bernat.mutation(api.events.update, {
      eventId,
      name: "Christmas Eve",
      startAt: allDayStart,
      endAt: allDayStart,
      allDay: true,
    });
    expect(
      await ctx.anna.query(api.secretSantas.current, {
        projectId: ctx.projectId,
      }),
    ).toMatchObject({
      name: "Christmas Eve",
      exchangeAt: allDayStart,
      exchangeAllDay: true,
    });
    expect(
      (await ctx.bernat.query(api.events.get, { eventId }))?.secretSanta,
    ).toEqual({ _id: secretSantaId, name: "Christmas Eve" });

    await ctx.bernat.mutation(api.events.remove, { eventId });
    expect(
      (
        await ctx.anna.query(api.secretSantas.current, {
          projectId: ctx.projectId,
        })
      )?.eventId,
    ).toBeNull();
  });

  it("drops removed participants from exclusions", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx);
    await ctx.anna.mutation(api.secretSantas.addExclusion, {
      secretSantaId,
      userIds: [ctx.annaId, ctx.bernatId],
    });
    await ctx.anna.mutation(api.secretSantas.update, {
      secretSantaId,
      name: "Christmas",
      exchangeAt: EXCHANGE_AT,
      exchangeAllDay: false,
      priceRange: { min: 0, max: 20 },
      participantIds: [ctx.annaId, ctx.carlaId, ctx.adminId],
    });
    const current = await ctx.anna.query(api.secretSantas.current, {
      projectId: ctx.projectId,
    });
    expect(current?.exclusions).toEqual([]);
  });

  it("archives so the group can start a new one", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx);
    await ctx.anna.mutation(api.secretSantas.archive, { secretSantaId });
    expect(
      await ctx.anna.query(api.secretSantas.current, {
        projectId: ctx.projectId,
      }),
    ).toBeNull();
    await expect(
      ctx.anna.mutation(api.secretSantas.draw, { secretSantaId }),
    ).rejects.toThrow("archived");
    await createSecretSanta(ctx);
  });
});

describe("exclusions", () => {
  it("rejects invalid groups and those that make the draw impossible", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx);
    await expect(
      ctx.anna.mutation(api.secretSantas.addExclusion, {
        secretSantaId,
        userIds: [ctx.annaId, ctx.bernatId, ctx.carlaId],
      }),
    ).rejects.toThrow("tooMany");
    await ctx.anna.mutation(api.secretSantas.addExclusion, {
      secretSantaId,
      userIds: [ctx.annaId, ctx.bernatId],
    });
    await ctx.anna.mutation(api.secretSantas.addExclusion, {
      secretSantaId,
      userIds: [ctx.annaId, ctx.carlaId],
    });
    await expect(
      ctx.anna.mutation(api.secretSantas.addExclusion, {
        secretSantaId,
        userIds: [ctx.annaId, ctx.adminId],
      }),
    ).rejects.toThrow("impossible");
    await expect(
      ctx.anna.mutation(api.secretSantas.addExclusion, {
        secretSantaId,
        userIds: [ctx.bernatId, ctx.annaId],
      }),
    ).rejects.toThrow("alreadyExists");

    await ctx.anna.mutation(api.secretSantas.removeExclusion, {
      secretSantaId,
      userIds: [ctx.carlaId, ctx.annaId],
    });
    const current = await ctx.anna.query(api.secretSantas.current, {
      projectId: ctx.projectId,
    });
    expect(current?.exclusions).toEqual([[ctx.annaId, ctx.bernatId]]);
  });
});

describe("draw", () => {
  it("shows each participant only their own receiver and that receiver's ideas", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx);
    await ctx.anna.mutation(api.secretSantas.addExclusion, {
      secretSantaId,
      userIds: [ctx.annaId, ctx.bernatId],
    });
    for (const participant of [ctx.anna, ctx.bernat, ctx.carla, ctx.admin]) {
      await participant.mutation(api.secretSantas.createGiftIdea, {
        secretSantaId,
        name: "Book",
        url: "books.example/novel",
      });
    }
    await ctx.anna.mutation(api.secretSantas.draw, { secretSantaId });

    const views = await Promise.all(
      [ctx.anna, ctx.bernat, ctx.carla, ctx.admin].map((participant) =>
        participant.query(api.secretSantas.current, {
          projectId: ctx.projectId,
        }),
      ),
    );
    const receivers = views.map((view) => view?.assignment?.userId);
    expect(new Set(receivers).size).toBe(4);
    expect(receivers[0]).not.toBe(ctx.annaId);
    expect(receivers[0]).not.toBe(ctx.bernatId);
    expect(receivers[1]).not.toBe(ctx.annaId);
    expect(views[0]?.assignment?.giftIdeas).toEqual([
      expect.objectContaining({
        name: "Book",
        url: "https://books.example/novel",
      }),
    ]);

    const notified = await ctx.t.run((c) =>
      c.db.query("notifications").collect(),
    );
    expect(notified.filter((row) => row.userId === ctx.annaId)).toEqual([]);
  });

  it("happens once and then fixes the participants", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx);
    await ctx.anna.mutation(api.secretSantas.draw, { secretSantaId });
    await expect(
      ctx.anna.mutation(api.secretSantas.draw, { secretSantaId }),
    ).rejects.toThrow("already been done");
    await expect(
      ctx.anna.mutation(api.secretSantas.update, {
        secretSantaId,
        name: "Christmas",
        exchangeAt: EXCHANGE_AT,
        exchangeAllDay: false,
        priceRange: { min: 0, max: 20 },
        participantIds: [ctx.annaId, ctx.bernatId],
      }),
    ).rejects.toThrow("cannot change after the draw");
  });

  it("leaves members who are not participants without an assignment", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx, [
      ctx.annaId,
      ctx.bernatId,
    ]);
    await ctx.anna.mutation(api.secretSantas.draw, { secretSantaId });
    expect(
      await ctx.carla.query(api.secretSantas.current, {
        projectId: ctx.projectId,
      }),
    ).toMatchObject({ isParticipant: false, assignment: null });
  });
});

describe("gift ideas", () => {
  it("belong to their author and accept only web links", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx, [
      ctx.annaId,
      ctx.bernatId,
    ]);
    await expect(
      ctx.carla.mutation(api.secretSantas.createGiftIdea, {
        secretSantaId,
        name: "Scarf",
      }),
    ).rejects.toThrow("Only participants");
    await expect(
      ctx.anna.mutation(api.secretSantas.createGiftIdea, {
        secretSantaId,
        name: "Scarf",
        url: "javascript:alert(1)",
      }),
    ).rejects.toThrow("Invalid link");

    const giftIdeaId = await ctx.anna.mutation(
      api.secretSantas.createGiftIdea,
      { secretSantaId, name: " Scarf ", description: " Red " },
    );
    await expect(
      ctx.bernat.mutation(api.secretSantas.removeGiftIdea, { giftIdeaId }),
    ).rejects.toThrow();
    await ctx.anna.mutation(api.secretSantas.updateGiftIdea, {
      giftIdeaId,
      name: "Wool scarf",
      description: "",
    });
    expect(
      await ctx.anna.query(api.secretSantas.myGiftIdeas, { secretSantaId }),
    ).toEqual([
      { _id: giftIdeaId, name: "Wool scarf", description: null, url: null },
    ]);
    expect(
      await ctx.bernat.query(api.secretSantas.myGiftIdeas, { secretSantaId }),
    ).toEqual([]);

    await ctx.anna.mutation(api.secretSantas.removeGiftIdea, { giftIdeaId });
    expect(
      await ctx.anna.query(api.secretSantas.myGiftIdeas, { secretSantaId }),
    ).toEqual([]);
  });
});

describe("membership changes", () => {
  it("withdraws a leaving member before the draw, with their ideas and exclusions", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx);
    await ctx.anna.mutation(api.secretSantas.addExclusion, {
      secretSantaId,
      userIds: [ctx.annaId, ctx.bernatId],
    });
    await ctx.bernat.mutation(api.secretSantas.createGiftIdea, {
      secretSantaId,
      name: "Socks",
    });
    await ctx.bernat.mutation(api.projects.leave, {
      projectId: ctx.projectId,
    });

    const current = await ctx.anna.query(api.secretSantas.current, {
      projectId: ctx.projectId,
    });
    expect(current?.participants.map((p) => p.userId)).not.toContain(
      ctx.bernatId,
    );
    expect(current?.exclusions).toEqual([]);
    const ideas = await ctx.t.run((c) =>
      c.db.query("secretSantaGiftIdeas").collect(),
    );
    expect(ideas).toEqual([]);
  });

  it("keeps a leaving member in a completed draw", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx);
    await ctx.anna.mutation(api.secretSantas.draw, { secretSantaId });
    await ctx.admin.mutation(api.projects.removeMember, {
      projectId: ctx.projectId,
      userId: ctx.bernatId,
    });
    const current = await ctx.anna.query(api.secretSantas.current, {
      projectId: ctx.projectId,
    });
    expect(current?.participants).toHaveLength(4);
    await ctx.anna.mutation(api.secretSantas.update, {
      secretSantaId,
      name: "Still on",
      exchangeAt: EXCHANGE_AT,
      exchangeAllDay: false,
      priceRange: { min: 0, max: 20 },
      participantIds: current?.participants.map((p) => p.userId) ?? [],
    });
  });

  it("erases a deleted account's participation and ideas", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx);
    await ctx.bernat.mutation(api.secretSantas.createGiftIdea, {
      secretSantaId,
      name: "Socks",
    });
    await ctx.t.run((c) => deleteUserAccount(c, ctx.bernatId));
    const rows = await ctx.t.run(async (c) => ({
      participants: await c.db
        .query("secretSantaParticipants")
        .withIndex("by_user", (q) => q.eq("userId", ctx.bernatId))
        .collect(),
      ideas: await c.db.query("secretSantaGiftIdeas").collect(),
    }));
    expect(rows).toEqual({ participants: [], ideas: [] });
  });

  it("deletes everything with the group", async () => {
    const ctx = await setup();
    const secretSantaId = await createSecretSanta(ctx);
    await ctx.anna.mutation(api.secretSantas.createGiftIdea, {
      secretSantaId,
      name: "Socks",
    });
    await ctx.admin.mutation(api.projects.remove, {
      projectId: ctx.projectId,
      confirmationName: "Family",
    });
    const counts = await ctx.t.run(async (c) => [
      (await c.db.query("secretSantas").collect()).length,
      (await c.db.query("secretSantaParticipants").collect()).length,
      (await c.db.query("secretSantaGiftIdeas").collect()).length,
    ]);
    expect(counts).toEqual([0, 0, 0]);
  });
});
