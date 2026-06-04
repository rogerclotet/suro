import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

const DAY = 86_400_000;
// Fixed reference instants so tests don't depend on the wall clock.
const JAN_10 = Date.parse("2024-01-10T09:00:00.000Z");
const JAN_10_END = Date.parse("2024-01-10T10:00:00.000Z");

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

describe("events: CRUD", () => {
  it("creates a timed event (trimming) and reads it back", async () => {
    const id = await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "  Dinner  ",
      description: "  out  ",
      startAt: JAN_10,
      endAt: JAN_10_END,
      allDay: false,
    });
    const event = await alice.query(api.events.get, { eventId: id });
    expect(event.name).toBe("Dinner");
    expect(event.description).toBe("out");
    expect(event.startAt).toBe(JAN_10);
    expect(event.endAt).toBe(JAN_10_END);
    expect(event.allDay).toBe(false);
    expect(event.list).toBeNull();
  });

  it("adds a day to an all-day event's end (create) and persists it on update", async () => {
    const dayStart = Date.UTC(2024, 0, 10);
    const id = await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Holiday",
      startAt: dayStart,
      endAt: dayStart, // single all-day; mutation normalizes end to +1 day
      allDay: true,
    });
    let event = await alice.query(api.events.get, { eventId: id });
    expect(event.endAt).toBe(dayStart + DAY);

    // Switching to a timed event must clear the +1-day normalization.
    await alice.mutation(api.events.update, {
      eventId: id,
      name: "Holiday",
      startAt: JAN_10,
      endAt: JAN_10_END,
      allDay: false,
    });
    event = await alice.query(api.events.get, { eventId: id });
    expect(event.allDay).toBe(false);
    expect(event.endAt).toBe(JAN_10_END);
  });

  it("rejects an empty name", async () => {
    await expect(
      alice.mutation(api.events.create, {
        projectId: ids.family,
        name: "   ",
        startAt: JAN_10,
        endAt: JAN_10_END,
        allDay: false,
      }),
    ).rejects.toThrow("Event name is required");
  });

  it("deletes an event", async () => {
    const id = await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Doomed",
      startAt: JAN_10,
      endAt: JAN_10_END,
      allDay: false,
    });
    await alice.mutation(api.events.remove, { eventId: id });
    await expect(alice.query(api.events.get, { eventId: id })).rejects.toThrow(
      "Event not found",
    );
  });

  it("rejects non-members", async () => {
    const id = await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Private",
      startAt: JAN_10,
      endAt: JAN_10_END,
      allDay: false,
    });
    await expect(bob.query(api.events.get, { eventId: id })).rejects.toThrow();
    await expect(
      bob.query(api.events.listByRange, {
        projectId: ids.family,
        from: 0,
        to: JAN_10 + DAY,
      }),
    ).rejects.toThrow();
  });
});

describe("events: range query", () => {
  async function makeEvent(name: string, startAt: number, endAt: number) {
    return alice.mutation(api.events.create, {
      projectId: ids.family,
      name,
      startAt,
      endAt,
      allDay: false,
    });
  }

  it("returns only events overlapping the window, sorted by start", async () => {
    const jan = Date.UTC(2024, 0, 1);
    const feb = Date.UTC(2024, 1, 1);
    await makeEvent("Late Jan", jan + 20 * DAY, jan + 20 * DAY + DAY);
    await makeEvent("Early Jan", jan + 2 * DAY, jan + 2 * DAY + DAY);
    await makeEvent("Feb", feb + DAY, feb + 2 * DAY); // outside January
    // Spans the Jan/Feb boundary — overlaps January.
    await makeEvent("Boundary", jan + 30 * DAY, feb + 3 * DAY);

    const janEnd = feb - 1; // 23:59:59.999 of Jan 31, roughly
    const events = await alice.query(api.events.listByRange, {
      projectId: ids.family,
      from: jan,
      to: janEnd,
    });
    expect(events.map((e) => e.name)).toEqual([
      "Early Jan",
      "Late Jan",
      "Boundary",
    ]);
  });
});

describe("events: linked lists", () => {
  it("creates a linked list and surfaces it on the event", async () => {
    const eventId = await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Camping",
      startAt: JAN_10,
      endAt: JAN_10_END,
      allDay: false,
    });
    const listId = await alice.mutation(api.events.createLinkedList, {
      eventId,
    });
    const event = await alice.query(api.events.get, { eventId });
    expect(event.list?._id).toBe(listId);
    expect(event.list?.name).toBe("Camping");
    // The list carries the event backlink.
    const list = await alice.query(api.lists.get, { listId });
    expect(list?.event?._id).toBe(eventId);
  });

  it("links and unlinks an existing list", async () => {
    const eventId = await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Trip",
      startAt: JAN_10,
      endAt: JAN_10_END,
      allDay: false,
    });
    const listId = await alice.mutation(api.lists.create, {
      projectId: ids.family,
      name: "Packing",
      description: "",
    });

    await alice.mutation(api.events.linkList, { eventId, listId });
    expect((await alice.query(api.events.get, { eventId })).list?._id).toBe(
      listId,
    );

    await alice.mutation(api.events.unlinkList, { eventId, listId });
    expect((await alice.query(api.events.get, { eventId })).list).toBeNull();
    // The list itself survives the unlink.
    expect((await alice.query(api.lists.get, { listId }))?.event).toBeNull();
  });

  it("nulls a linked list's backlink when the event is deleted", async () => {
    const eventId = await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Party",
      startAt: JAN_10,
      endAt: JAN_10_END,
      allDay: false,
    });
    const listId = await alice.mutation(api.events.createLinkedList, {
      eventId,
    });
    await alice.mutation(api.events.remove, { eventId });

    const list = await alice.query(api.lists.get, { listId });
    expect(list?.event).toBeNull();
  });

  it("rejects linking a list from another project", async () => {
    const eventId = await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Trip",
      startAt: JAN_10,
      endAt: JAN_10_END,
      allDay: false,
    });
    const foreignList = await t.run((ctx) =>
      ctx.db.insert("lists", {
        name: "Theirs",
        description: "",
        projectId: ids.other,
        favorite: false,
        createdBy: ids.bob,
        updatedAt: Date.now(),
      }),
    );
    await expect(
      alice.mutation(api.events.linkList, { eventId, listId: foreignList }),
    ).rejects.toThrow();
  });
});

describe("calendar feed (ICS export)", () => {
  it("returns a stable token across calls and rejects non-members", async () => {
    const token = await alice.mutation(api.events.getOrCreateCalendarToken, {
      projectId: ids.family,
    });
    expect(token).toMatch(/^[a-f0-9]{32}$/);
    const again = await alice.mutation(api.events.getOrCreateCalendarToken, {
      projectId: ids.family,
    });
    expect(again).toBe(token);
    await expect(
      bob.mutation(api.events.getOrCreateCalendarToken, {
        projectId: ids.family,
      }),
    ).rejects.toThrow();
  });

  it("exportData returns events only for the matching token", async () => {
    await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Dinner",
      startAt: JAN_10,
      endAt: JAN_10_END,
      allDay: false,
    });
    const token = await alice.mutation(api.events.getOrCreateCalendarToken, {
      projectId: ids.family,
    });

    const data = await t.query(internal.events.exportData, {
      projectId: ids.family,
      token,
    });
    expect(data?.calendarName).toBe("Family");
    expect(data?.events.map((e) => e.name)).toEqual(["Dinner"]);

    expect(
      await t.query(internal.events.exportData, {
        projectId: ids.family,
        token: "wrong",
      }),
    ).toBeNull();
    expect(
      await t.query(internal.events.exportData, {
        projectId: ids.family,
        token: "",
      }),
    ).toBeNull();
  });

  it("serves a text/calendar feed over HTTP, gated by the token", async () => {
    await alice.mutation(api.events.create, {
      projectId: ids.family,
      name: "Holiday",
      startAt: Date.UTC(2024, 0, 10),
      endAt: Date.UTC(2024, 0, 10),
      allDay: true,
    });
    const token = await alice.mutation(api.events.getOrCreateCalendarToken, {
      projectId: ids.family,
    });

    const ok = await t.fetch(
      `/calendar.ics?projectId=${ids.family}&token=${token}`,
    );
    expect(ok.status).toBe(200);
    expect(ok.headers.get("Content-Type")).toContain("text/calendar");
    const body = await ok.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("SUMMARY:Holiday");
    expect(body).toContain("DTSTART;VALUE=DATE:20240110");

    const bad = await t.fetch(
      `/calendar.ics?projectId=${ids.family}&token=nope`,
    );
    expect(bad.status).toBe(404);

    const missing = await t.fetch(`/calendar.ics?projectId=${ids.family}`);
    expect(missing.status).toBe(400);
  });
});
