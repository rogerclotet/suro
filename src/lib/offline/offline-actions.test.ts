/**
 * Tests that verify offline action behaviour:
 * - When ONLINE  → calls the server action directly, no IndexedDB writes
 * - When OFFLINE → writes to IndexedDB and enqueues the correct payload for the sync API
 * - When server action FAILS → falls back to IndexedDB even if technically online
 *
 * The payloads verified here must match what the sync API handlers in
 * src/app/api/offline/sync/route.ts expect to receive.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// --- DB mock ---
const mockDbAdd = vi.fn().mockResolvedValue(undefined);
const mockDbGet = vi.fn().mockResolvedValue(null);
const mockDbUpdate = vi.fn().mockResolvedValue(undefined);
const mockDbDelete = vi.fn().mockResolvedValue(undefined);

const mockTable = () => ({
  add: mockDbAdd,
  get: mockDbGet,
  update: mockDbUpdate,
  delete: mockDbDelete,
});

vi.mock("./db", () => ({
  db: {
    listItems: mockTable(),
    events: mockTable(),
    notes: mockTable(),
    pots: mockTable(),
    spendings: mockTable(),
  },
}));

// --- SyncManager mock ---
const mockEnqueue = vi.fn().mockResolvedValue(undefined);
vi.mock("./sync-manager", () => ({
  syncManager: { enqueue: (...a: unknown[]) => mockEnqueue(...a) },
}));

// --- Server action mocks ---
const mockServerCreateListItem = vi.fn().mockResolvedValue(undefined);
const mockServerUpdateListItem = vi.fn().mockResolvedValue(undefined);
const mockServerDeleteListItem = vi.fn().mockResolvedValue(undefined);

vi.mock(
  "@/app/[locale]/groups/[projectId]/lists/[listId]/_components/list-item/actions",
  () => ({
    createListItem: (...a: unknown[]) => mockServerCreateListItem(...a),
    updateListItem: (...a: unknown[]) => mockServerUpdateListItem(...a),
    deleteListItem: (...a: unknown[]) => mockServerDeleteListItem(...a),
  }),
);

const mockServerCreateEvent = vi.fn().mockResolvedValue(undefined);
const mockServerUpdateEvent = vi.fn().mockResolvedValue(undefined);
const mockServerDeleteEvent = vi.fn().mockResolvedValue(undefined);

vi.mock(
  "@/app/[locale]/groups/[projectId]/calendar/_components/event/actions",
  () => ({
    createEvent: (...a: unknown[]) => mockServerCreateEvent(...a),
  }),
);

vi.mock("@/app/[locale]/groups/[projectId]/calendar/[eventId]/actions", () => ({
  editEvent: (...a: unknown[]) => mockServerUpdateEvent(...a),
  deleteEvent: (...a: unknown[]) => mockServerDeleteEvent(...a),
}));

const mockServerCreateNote = vi.fn().mockResolvedValue("server-note-id");
vi.mock(
  "@/app/[locale]/groups/[projectId]/notes/_components/create-note-button/actions",
  () => ({
    createNote: (...a: unknown[]) => mockServerCreateNote(...a),
  }),
);

const mockServerCreatePot = vi.fn().mockResolvedValue("server-pot-id");
const mockServerCreateSpending = vi.fn().mockResolvedValue(undefined);
vi.mock(
  "@/app/[locale]/groups/[projectId]/expenses/_components/create-pot-button/actions",
  () => ({
    createPot: (...a: unknown[]) => mockServerCreatePot(...a),
  }),
);
vi.mock(
  "@/app/[locale]/groups/[projectId]/expenses/_components/create-spending-button/actions",
  () => ({
    createSpending: (...a: unknown[]) => mockServerCreateSpending(...a),
  }),
);

// --- Helpers to simulate online / offline ---
function setNavigatorOnline(online: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value: online,
    configurable: true,
  });
}

function mockFetchHealth(ok: boolean) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok }));
}

function mockFetchOffline() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
  );
}

// --- Shared fixtures ---
const mockList = {
  id: "list-1",
  projectId: "project-1",
  name: "Test list",
} as never;
const mockProject = { id: "project-1", name: "Test project" } as never;
const mockPot = {
  id: "pot-1",
  projectId: "project-1",
  name: "Trip",
  settledAt: null,
} as never;
const mockEvent = {
  id: "event-1",
  projectId: "project-1",
  name: "Meeting",
  createdBy: "user-1",
  createdAt: new Date(),
  startAt: new Date(),
  endAt: new Date(),
  allDay: false,
} as never;
const _mockNote = {
  id: "note-1",
  projectId: "project-1",
  name: "Note",
  createdBy: "user-1",
  createdAt: new Date(),
} as never;
const _mockSpending = {
  id: "spending-1",
  projectId: "project-1",
  potId: "pot-1",
} as never;

// --- Import modules under test ---
const { createListItemOffline, updateListItemOffline, deleteListItemOffline } =
  await import("./offline-actions");
const { createEventOffline, updateEventOffline, deleteEventOffline } =
  await import("./offline-events");
const { createNoteOffline } = await import("./offline-notes");
const { createPotOffline, createSpendingOffline } = await import(
  "./offline-spendings"
);

// ---

describe("offline actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbAdd.mockResolvedValue(undefined);
    mockDbGet.mockResolvedValue(null);
    mockDbUpdate.mockResolvedValue(undefined);
    mockDbDelete.mockResolvedValue(undefined);
    mockEnqueue.mockResolvedValue(undefined);
    mockServerCreateListItem.mockResolvedValue(undefined);
    mockServerUpdateListItem.mockResolvedValue(undefined);
    mockServerDeleteListItem.mockResolvedValue(undefined);
    mockServerCreateEvent.mockResolvedValue(undefined);
    mockServerUpdateEvent.mockResolvedValue(undefined);
    mockServerDeleteEvent.mockResolvedValue(undefined);
    mockServerCreateNote.mockResolvedValue("server-note-id");
    mockServerCreatePot.mockResolvedValue("server-pot-id");
    mockServerCreateSpending.mockResolvedValue(undefined);
  });

  // ==========================
  // List Items
  // ==========================

  describe("createListItemOffline", () => {
    it("online: calls server action, skips IndexedDB", async () => {
      setNavigatorOnline(true);
      mockFetchHealth(true);

      const result = await createListItemOffline(mockList, {
        name: "Buy milk",
        categoryId: null,
      });

      expect(mockServerCreateListItem).toHaveBeenCalledWith(mockList, {
        name: "Buy milk",
        completed: false,
        categoryId: null,
      });
      expect(mockDbAdd).not.toHaveBeenCalled();
      expect(mockEnqueue).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it("offline (navigator.onLine=false): saves to IndexedDB and enqueues sync", async () => {
      setNavigatorOnline(false);

      const result = await createListItemOffline(mockList, {
        name: "Buy milk",
        categoryId: null,
      });

      expect(mockServerCreateListItem).not.toHaveBeenCalled();
      expect(mockDbAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^local-/),
          name: "Buy milk",
          listId: "list-1",
          completed: false,
          categoryId: null,
          _syncStatus: "pending",
        }),
      );
      expect(result).toMatch(/^local-/);
    });

    it("offline: enqueue payload matches sync API contract", async () => {
      setNavigatorOnline(false);

      await createListItemOffline(mockList, {
        name: "Buy milk",
        categoryId: "cat-1",
      });

      expect(mockEnqueue).toHaveBeenCalledWith({
        entityType: "listItem",
        operation: "create",
        entityId: expect.stringMatching(/^local-/),
        listId: "list-1",
        projectId: "project-1",
        // Sync API reads: payload.name, payload.categoryId
        payload: { name: "Buy milk", categoryId: "cat-1" },
      });
    });

    it("offline (health check fails): falls back to IndexedDB even when navigator.onLine=true", async () => {
      setNavigatorOnline(true);
      mockFetchOffline();

      await createListItemOffline(mockList, {
        name: "Buy milk",
        categoryId: null,
      });

      expect(mockServerCreateListItem).not.toHaveBeenCalled();
      expect(mockDbAdd).toHaveBeenCalled();
    });

    it("server failure: falls back to IndexedDB when server action throws", async () => {
      setNavigatorOnline(true);
      mockFetchHealth(true);
      mockServerCreateListItem.mockRejectedValueOnce(new Error("Server error"));

      const result = await createListItemOffline(mockList, {
        name: "Buy milk",
        categoryId: null,
      });

      expect(mockDbAdd).toHaveBeenCalled();
      expect(mockEnqueue).toHaveBeenCalled();
      expect(result).toMatch(/^local-/);
    });

    it("throws when list.id is missing", async () => {
      await expect(
        createListItemOffline({ id: "" } as never, {
          name: "x",
          categoryId: null,
        }),
      ).rejects.toThrow("Invalid list object");
    });
  });

  describe("updateListItemOffline", () => {
    it("online: calls server action, skips IndexedDB", async () => {
      setNavigatorOnline(true);
      mockFetchHealth(true);

      await updateListItemOffline(
        mockList,
        "item-1",
        "Updated",
        "",
        true,
        null,
      );

      expect(mockServerUpdateListItem).toHaveBeenCalledWith(
        mockList,
        "item-1",
        "Updated",
        "",
        true,
        null,
      );
      expect(mockDbAdd).not.toHaveBeenCalled();
      expect(mockEnqueue).not.toHaveBeenCalled();
    });

    it("offline: updates existing item in IndexedDB", async () => {
      setNavigatorOnline(false);
      mockDbGet.mockResolvedValue({ _localVersion: 2 });

      await updateListItemOffline(
        mockList,
        "item-1",
        "Updated",
        "details",
        true,
        "cat-1",
      );

      expect(mockDbUpdate).toHaveBeenCalledWith(
        "item-1",
        expect.objectContaining({
          name: "Updated",
          completed: true,
          categoryId: "cat-1",
          _syncStatus: "pending",
        }),
      );
    });

    it("offline: adds item to IndexedDB when it doesn't exist yet", async () => {
      setNavigatorOnline(false);
      mockDbGet.mockResolvedValue(null);

      await updateListItemOffline(mockList, "item-1", "New", "", false, null);

      expect(mockDbAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "item-1",
          listId: "list-1",
          _syncStatus: "pending",
        }),
      );
    });

    it("offline: enqueue payload matches sync API contract", async () => {
      setNavigatorOnline(false);

      await updateListItemOffline(
        mockList,
        "item-1",
        "Buy milk",
        "2 litres",
        true,
        "cat-1",
      );

      expect(mockEnqueue).toHaveBeenCalledWith({
        entityType: "listItem",
        operation: "update",
        entityId: "item-1",
        listId: "list-1",
        projectId: "project-1",
        // Sync API reads: payload.name, payload.details, payload.completed, payload.categoryId
        payload: {
          name: "Buy milk",
          details: "2 litres",
          completed: true,
          categoryId: "cat-1",
        },
      });
    });
  });

  describe("deleteListItemOffline", () => {
    it("online: calls server action and removes from IndexedDB", async () => {
      setNavigatorOnline(true);
      mockFetchHealth(true);

      await deleteListItemOffline(mockList, "item-1");

      expect(mockServerDeleteListItem).toHaveBeenCalledWith(mockList, "item-1");
      expect(mockDbDelete).toHaveBeenCalledWith("item-1");
      expect(mockEnqueue).not.toHaveBeenCalled();
    });

    it("offline: marks item as deleted and enqueues", async () => {
      setNavigatorOnline(false);
      mockDbGet.mockResolvedValue({ id: "item-1" });

      await deleteListItemOffline(mockList, "item-1");

      expect(mockDbUpdate).toHaveBeenCalledWith(
        "item-1",
        expect.objectContaining({ _deleted: true, _syncStatus: "pending" }),
      );
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: "delete",
          entityId: "item-1",
          payload: {},
        }),
      );
    });
  });

  // ==========================
  // Events
  // ==========================

  describe("createEventOffline", () => {
    const eventData = {
      name: "Team meeting",
      description: "Weekly sync",
      dates: {
        from: new Date("2026-05-01T10:00:00Z"),
        to: new Date("2026-05-01T12:00:00Z"),
      },
      allDay: false,
    };

    it("online: calls server action, skips IndexedDB", async () => {
      setNavigatorOnline(true);
      mockFetchHealth(true);

      const result = await createEventOffline(eventData, mockProject);

      expect(mockServerCreateEvent).toHaveBeenCalled();
      expect(mockDbAdd).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it("offline: saves to IndexedDB with numeric timestamps", async () => {
      setNavigatorOnline(false);

      await createEventOffline(eventData, mockProject);

      expect(mockDbAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^local-/),
          name: "Team meeting",
          projectId: "project-1",
          startAt: eventData.dates.from.getTime(),
          endAt: eventData.dates.to.getTime(),
          allDay: false,
          _syncStatus: "pending",
        }),
      );
    });

    it("offline: enqueue payload matches sync API contract", async () => {
      setNavigatorOnline(false);

      await createEventOffline(eventData, mockProject);

      // Sync API reads payload.startAt / payload.endAt as numbers, converts to Date
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "event",
          operation: "create",
          projectId: "project-1",
          payload: expect.objectContaining({
            startAt: expect.any(Number),
            endAt: expect.any(Number),
            name: "Team meeting",
            allDay: false,
          }),
        }),
      );
    });

    it("offline allDay: adds 24h to endAt in payload", async () => {
      setNavigatorOnline(false);
      const allDayData = { ...eventData, allDay: true };

      await createEventOffline(allDayData, mockProject);

      const expectedEndAt = eventData.dates.to.getTime() + 24 * 60 * 60 * 1000;
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ endAt: expectedEndAt }),
        }),
      );
    });
  });

  describe("updateEventOffline", () => {
    const eventData = {
      name: "Updated meeting",
      dates: {
        from: new Date("2026-05-02T09:00:00Z"),
        to: new Date("2026-05-02T10:00:00Z"),
      },
      allDay: false,
    };

    it("online: calls server action", async () => {
      setNavigatorOnline(true);
      mockFetchHealth(true);

      await updateEventOffline(mockEvent, eventData, mockProject);

      expect(mockServerUpdateEvent).toHaveBeenCalled();
      expect(mockEnqueue).not.toHaveBeenCalled();
    });

    it("offline: enqueue payload has numeric timestamps matching sync API contract", async () => {
      setNavigatorOnline(false);

      await updateEventOffline(mockEvent, eventData, mockProject);

      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "event",
          operation: "update",
          entityId: "event-1",
          payload: expect.objectContaining({
            startAt: expect.any(Number),
            endAt: expect.any(Number),
          }),
        }),
      );
    });
  });

  describe("deleteEventOffline", () => {
    it("online: calls server action and removes from IndexedDB", async () => {
      setNavigatorOnline(true);
      mockFetchHealth(true);

      await deleteEventOffline(mockEvent);

      expect(mockServerDeleteEvent).toHaveBeenCalledWith(mockEvent);
      expect(mockDbDelete).toHaveBeenCalledWith("event-1");
      expect(mockEnqueue).not.toHaveBeenCalled();
    });

    it("offline: enqueues delete payload matching sync API contract", async () => {
      setNavigatorOnline(false);

      await deleteEventOffline(mockEvent);

      expect(mockEnqueue).toHaveBeenCalledWith({
        entityType: "event",
        operation: "delete",
        entityId: "event-1",
        projectId: "project-1",
        payload: {},
      });
    });
  });

  // ==========================
  // Notes
  // ==========================

  describe("createNoteOffline", () => {
    const noteData = {
      name: "Shopping list",
      contents: "Milk, eggs, bread",
      format: "text",
    };

    it("online: calls server action and returns server note id", async () => {
      setNavigatorOnline(true);
      mockFetchHealth(true);
      mockServerCreateNote.mockResolvedValue("server-note-123");

      const result = await createNoteOffline(mockProject, noteData);

      expect(mockServerCreateNote).toHaveBeenCalledWith(mockProject, noteData);
      expect(mockDbAdd).not.toHaveBeenCalled();
      expect(result).toBe("server-note-123");
    });

    it("offline: saves to IndexedDB with correct fields", async () => {
      setNavigatorOnline(false);

      const result = await createNoteOffline(mockProject, noteData);

      expect(mockDbAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^local-/),
          name: "Shopping list",
          contents: "Milk, eggs, bread",
          format: "text",
          projectId: "project-1",
          _syncStatus: "pending",
        }),
      );
      expect(result).toMatch(/^local-/);
    });

    it("offline: enqueue payload matches sync API contract", async () => {
      setNavigatorOnline(false);

      await createNoteOffline(mockProject, noteData);

      expect(mockEnqueue).toHaveBeenCalledWith({
        entityType: "note",
        operation: "create",
        entityId: expect.stringMatching(/^local-/),
        projectId: "project-1",
        // Sync API reads: payload.name, payload.contents, payload.format
        payload: {
          name: "Shopping list",
          contents: "Milk, eggs, bread",
          format: "text",
        },
      });
    });
  });

  // ==========================
  // Spendings & Pots
  // ==========================

  describe("createPotOffline", () => {
    const potData = { name: "Holiday trip", memberIds: ["user-1", "user-2"] };

    it("online: calls server action and returns server pot id", async () => {
      setNavigatorOnline(true);
      mockFetchHealth(true);

      const result = await createPotOffline("project-1", potData);

      expect(mockServerCreatePot).toHaveBeenCalledWith("project-1", potData);
      expect(mockDbAdd).not.toHaveBeenCalled();
      expect(result).toBe("server-pot-id");
    });

    it("offline: saves to IndexedDB and returns local id", async () => {
      setNavigatorOnline(false);

      const result = await createPotOffline("project-1", potData);

      expect(mockDbAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^local-/),
          name: "Holiday trip",
          projectId: "project-1",
          _syncStatus: "pending",
        }),
      );
      expect(result).toMatch(/^local-/);
    });

    it("offline: enqueue payload includes memberIds for sync API", async () => {
      setNavigatorOnline(false);

      await createPotOffline("project-1", potData);

      expect(mockEnqueue).toHaveBeenCalledWith({
        entityType: "pot",
        operation: "create",
        entityId: expect.stringMatching(/^local-/),
        projectId: "project-1",
        // Sync API reads: payload.name, payload.memberIds
        payload: { name: "Holiday trip", memberIds: ["user-1", "user-2"] },
      });
    });
  });

  describe("createSpendingOffline", () => {
    const spendingData = {
      amount: 12.5,
      description: "Lunch",
      from: "user-1",
      to: "user-2",
    };

    it("online: calls server action with raw amount", async () => {
      setNavigatorOnline(true);
      mockFetchHealth(true);

      await createSpendingOffline(mockPot, spendingData);

      expect(mockServerCreateSpending).toHaveBeenCalledWith("pot-1", {
        amount: 12.5,
        description: "Lunch",
        from: "user-1",
        to: "user-2",
      });
      expect(mockDbAdd).not.toHaveBeenCalled();
    });

    it("offline: stores amount in cents in IndexedDB", async () => {
      setNavigatorOnline(false);

      await createSpendingOffline(mockPot, spendingData);

      expect(mockDbAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          // IndexedDB stores cents: 12.5 * 100 = 1250
          amount: 1250,
          currency: "EUR",
          potId: "pot-1",
          _syncStatus: "pending",
        }),
      );
    });

    it("offline: enqueue payload sends raw euros (sync API multiplies by 100)", async () => {
      setNavigatorOnline(false);

      await createSpendingOffline(mockPot, spendingData);

      expect(mockEnqueue).toHaveBeenCalledWith({
        entityType: "spending",
        operation: "create",
        entityId: expect.stringMatching(/^local-/),
        projectId: "project-1",
        potId: "pot-1",
        // Sync API does: Math.round(payload.amount * 100)
        // So payload must carry raw euros, NOT cents
        payload: {
          amount: 12.5,
          description: "Lunch",
          from: "user-1",
          to: "user-2",
        },
      });
    });

    it("offline: 10.99 euros → 1099 cents in IndexedDB", async () => {
      setNavigatorOnline(false);

      await createSpendingOffline(mockPot, {
        amount: 10.99,
        description: undefined,
        from: "user-1",
        to: "user-2",
      });

      expect(mockDbAdd).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 1099 }),
      );
    });
  });
});
