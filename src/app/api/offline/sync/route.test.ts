/**
 * Tests that verify the contract between offline action payloads and the sync API handlers.
 *
 * Each test uses the exact payload shape produced by the corresponding offline action
 * (offline-actions.ts, offline-events.ts, offline-notes.ts, offline-spendings.ts)
 * to ensure they are compatible with what the sync API handlers expect.
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock setup ---

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: mockAuth }));

// Query mocks
const mockFindFirst = {
  listItems: vi.fn(),
  lists: vi.fn(),
  events: vi.fn(),
  notes: vi.fn(),
  pots: vi.fn(),
  spendings: vi.fn(),
};

const mockDbInsert = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbDelete = vi.fn();

vi.mock("@/server/db", () => ({
  db: {
    query: {
      listItems: {
        findFirst: (...a: unknown[]) => mockFindFirst.listItems(...a),
      },
      lists: { findFirst: (...a: unknown[]) => mockFindFirst.lists(...a) },
      events: { findFirst: (...a: unknown[]) => mockFindFirst.events(...a) },
      notes: { findFirst: (...a: unknown[]) => mockFindFirst.notes(...a) },
      pots: { findFirst: (...a: unknown[]) => mockFindFirst.pots(...a) },
      spendings: {
        findFirst: (...a: unknown[]) => mockFindFirst.spendings(...a),
      },
    },
    insert: (...a: unknown[]) => mockDbInsert(...a),
    update: (...a: unknown[]) => mockDbUpdate(...a),
    delete: (...a: unknown[]) => mockDbDelete(...a),
  },
}));

const mockGetList = vi.fn();
const mockGetPot = vi.fn();
const mockGetUserProject = vi.fn();
const mockGetProjectCategoryId = vi.fn();

vi.mock("@/server/lists", () => ({
  getList: (...a: unknown[]) => mockGetList(...a),
}));
vi.mock("@/server/pots", () => ({
  getPot: (...a: unknown[]) => mockGetPot(...a),
}));
vi.mock("@/server/projects", () => ({
  getUserProject: (...a: unknown[]) => mockGetUserProject(...a),
}));
vi.mock("@/server/action-auth", () => ({
  getProjectCategoryId: (...a: unknown[]) => mockGetProjectCategoryId(...a),
  requireSession: vi.fn(),
  requireProject: vi.fn(),
  requireEvent: vi.fn(),
}));

// --- Helpers ---

const mockSession = { user: { id: "user-1" } };
const mockProject = { id: "project-1", users: [{ user: { id: "user-1" } }] };
const mockList = { id: "list-1", projectId: "project-1" };
const mockPot = {
  id: "pot-1",
  projectId: "project-1",
  settledAt: null,
  users: [],
};
const NOW = 1700000000000;

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/offline/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Sets up db.insert() to return returnedRows via .values().returning() */
function setupInsert(returnedRows: unknown[]) {
  const returning = vi.fn().mockResolvedValue(returnedRows);
  const values = vi.fn().mockReturnValue({ returning });
  mockDbInsert.mockReturnValue({ values });
  return { values, returning };
}

/** Sets up db.update() chain: .set().where().returning() */
function setupUpdate(returnedRows: unknown[]) {
  const returning = vi.fn().mockResolvedValue(returnedRows);
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  mockDbUpdate.mockReturnValue({ set });
  return { set, where, returning };
}

/** Sets up db.delete() chain: .where() */
function setupDelete() {
  const where = vi.fn().mockResolvedValue(undefined);
  mockDbDelete.mockReturnValue({ where });
  return { where };
}

// Import handler after mocks
const { POST } = await import("./route");

// ---

describe("POST /api/offline/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    for (const fn of Object.values(mockFindFirst)) fn.mockResolvedValue(null);
    mockGetList.mockResolvedValue(mockList);
    mockGetUserProject.mockResolvedValue(mockProject);
    mockGetPot.mockResolvedValue(mockPot);
    mockGetProjectCategoryId.mockResolvedValue(null);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(
      makeRequest({
        entityType: "listItem",
        operation: "create",
        entityId: "local-1",
        listId: "list-1",
        payload: {},
        clientTimestamp: NOW,
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for unsupported entity type", async () => {
    const res = await POST(
      makeRequest({
        entityType: "unknown",
        operation: "create",
        entityId: "abc",
        payload: {},
        clientTimestamp: NOW,
      }),
    );
    expect(res.status).toBe(400);
  });

  // ---- List Item ----

  describe("listItem", () => {
    it("create: inserts item with payload fields, local- prefix becomes undefined id", async () => {
      const payload = { name: "Buy milk", categoryId: null };
      const row = {
        id: "server-1",
        name: "Buy milk",
        listId: "list-1",
        completed: false,
        categoryId: null,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: null,
        details: null,
      };
      const { values } = setupInsert([row]);

      const res = await POST(
        makeRequest({
          entityType: "listItem",
          operation: "create",
          entityId: "local-abc",
          listId: "list-1",
          payload,
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(200);
      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Buy milk",
          listId: "list-1",
          createdBy: "user-1",
          completed: false,
          id: undefined,
        }),
      );
    });

    it("create: non-local entityId is used as DB id", async () => {
      const row = {
        id: "real-id",
        name: "x",
        listId: "list-1",
        completed: false,
        categoryId: null,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: null,
        details: null,
      };
      const { values } = setupInsert([row]);

      await POST(
        makeRequest({
          entityType: "listItem",
          operation: "create",
          entityId: "real-id",
          listId: "list-1",
          payload: { name: "x" },
          clientTimestamp: NOW,
        }),
      );

      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({ id: "real-id" }),
      );
    });

    it("create: returns 409 when server item is newer than clientTimestamp", async () => {
      mockFindFirst.listItems.mockResolvedValue({
        id: "item-1",
        updatedAt: new Date(NOW + 5000),
        name: "Server",
      });

      const res = await POST(
        makeRequest({
          entityType: "listItem",
          operation: "create",
          entityId: "item-1",
          listId: "list-1",
          payload: { name: "Local" },
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.message).toBe("Conflict");
      expect(body.serverData).toBeDefined();
    });

    it("create: returns existing item when not conflicting", async () => {
      const existing = {
        id: "item-1",
        updatedAt: new Date(NOW - 1000),
        name: "Existing",
        listId: "list-1",
        completed: false,
        categoryId: null,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedBy: null,
        details: null,
      };
      mockFindFirst.listItems.mockResolvedValue(existing);

      const res = await POST(
        makeRequest({
          entityType: "listItem",
          operation: "create",
          entityId: "item-1",
          listId: "list-1",
          payload: { name: "Local" },
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(200);
      // Should not call insert since item already exists
      expect(mockDbInsert).not.toHaveBeenCalled();
    });

    it("update: updates with exact payload fields from offline action", async () => {
      mockFindFirst.listItems.mockResolvedValue({
        id: "item-1",
        listId: "list-1",
        updatedAt: new Date(NOW - 5000),
      });
      const row = {
        id: "item-1",
        name: "Buy milk",
        completed: true,
        listId: "list-1",
        updatedAt: new Date(),
        createdAt: new Date(),
        updatedBy: "user-1",
        createdBy: "user-1",
        details: null,
        categoryId: null,
      };
      const { set } = setupUpdate([row]);

      // Payload sent by offline-actions.ts updateListItemOffline
      const res = await POST(
        makeRequest({
          entityType: "listItem",
          operation: "update",
          entityId: "item-1",
          listId: "list-1",
          payload: {
            name: "Buy milk",
            completed: true,
            categoryId: null,
            details: null,
          },
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(200);
      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Buy milk",
          completed: true,
          updatedBy: "user-1",
        }),
      );
    });

    it("update: returns 409 when server item is newer", async () => {
      mockFindFirst.listItems.mockResolvedValue({
        id: "item-1",
        listId: "list-1",
        updatedAt: new Date(NOW + 5000),
      });

      const res = await POST(
        makeRequest({
          entityType: "listItem",
          operation: "update",
          entityId: "item-1",
          listId: "list-1",
          payload: { name: "x", completed: false },
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(409);
    });

    it("update: _forceOverwrite bypasses conflict check", async () => {
      mockFindFirst.listItems.mockResolvedValue({
        id: "item-1",
        listId: "list-1",
        updatedAt: new Date(NOW + 5000),
      });
      const row = {
        id: "item-1",
        name: "Force",
        completed: false,
        listId: "list-1",
        updatedAt: new Date(),
        createdAt: new Date(),
        updatedBy: "user-1",
        createdBy: "user-1",
        details: null,
        categoryId: null,
      };
      setupUpdate([row]);

      const res = await POST(
        makeRequest({
          entityType: "listItem",
          operation: "update",
          entityId: "item-1",
          listId: "list-1",
          payload: { name: "Force", completed: false, _forceOverwrite: true },
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(200);
    });

    it("update: returns 404 when item does not exist", async () => {
      mockFindFirst.listItems.mockResolvedValue(null);

      const res = await POST(
        makeRequest({
          entityType: "listItem",
          operation: "update",
          entityId: "missing",
          listId: "list-1",
          payload: { name: "x", completed: false },
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(404);
    });

    it("delete: removes item and returns { deleted: true }", async () => {
      setupDelete();

      const res = await POST(
        makeRequest({
          entityType: "listItem",
          operation: "delete",
          entityId: "item-1",
          listId: "list-1",
          payload: {},
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ deleted: true });
    });
  });

  // ---- Event ----

  describe("event", () => {
    const startAt = new Date("2026-05-01T10:00:00Z").getTime();
    const endAt = new Date("2026-05-01T12:00:00Z").getTime();

    it("create: converts timestamp numbers to Date objects for DB", async () => {
      // Payload from offline-events.ts uses numeric timestamps
      const payload = {
        name: "Team meeting",
        description: "Weekly",
        startAt,
        endAt,
        allDay: false,
      };
      const row = {
        id: "ev-1",
        name: "Team meeting",
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        allDay: false,
        projectId: "project-1",
        description: "Weekly",
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: null,
        updatedBy: null,
      };
      const { values } = setupInsert([row]);

      const res = await POST(
        makeRequest({
          entityType: "event",
          operation: "create",
          entityId: "local-ev",
          projectId: "project-1",
          payload,
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(200);
      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          createdBy: "user-1",
        }),
      );
    });

    it("create: response serialises dates back to timestamps for sync manager", async () => {
      const row = {
        id: "ev-1",
        name: "Meeting",
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        allDay: false,
        projectId: "project-1",
        description: null,
        createdBy: "user-1",
        createdAt: new Date(NOW),
        updatedAt: null,
        updatedBy: null,
      };
      setupInsert([row]);

      const res = await POST(
        makeRequest({
          entityType: "event",
          operation: "create",
          entityId: "local-ev",
          projectId: "project-1",
          payload: { name: "Meeting", startAt, endAt, allDay: false },
          clientTimestamp: NOW,
        }),
      );

      const body = await res.json();
      expect(typeof body.startAt).toBe("number");
      expect(typeof body.endAt).toBe("number");
      expect(body.startAt).toBe(startAt);
    });

    it("update: sends Date objects to DB and includes updatedBy", async () => {
      mockFindFirst.events.mockResolvedValue({
        id: "ev-1",
        projectId: "project-1",
        updatedAt: new Date(NOW - 1000),
      });
      const row = {
        id: "ev-1",
        name: "Updated",
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        allDay: false,
        projectId: "project-1",
        description: null,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: "user-1",
      };
      const { set } = setupUpdate([row]);

      await POST(
        makeRequest({
          entityType: "event",
          operation: "update",
          entityId: "ev-1",
          projectId: "project-1",
          payload: {
            name: "Updated",
            description: null,
            startAt,
            endAt,
            allDay: false,
          },
          clientTimestamp: NOW,
        }),
      );

      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({
          startAt: expect.any(Date),
          updatedBy: "user-1",
        }),
      );
    });

    it("delete: removes event and returns { deleted: true }", async () => {
      setupDelete();

      const res = await POST(
        makeRequest({
          entityType: "event",
          operation: "delete",
          entityId: "ev-1",
          projectId: "project-1",
          payload: {},
          clientTimestamp: NOW,
        }),
      );

      expect(await res.json()).toMatchObject({ deleted: true });
    });
  });

  // ---- Note ----

  describe("note", () => {
    it("create: inserts with name, contents, format from payload", async () => {
      // Exact payload from offline-notes.ts createNoteOffline
      const payload = {
        name: "Shopping list",
        contents: "Milk, eggs, bread",
        format: "text",
      };
      const row = {
        id: "note-1",
        name: "Shopping list",
        contents: "Milk, eggs, bread",
        format: "text",
        projectId: "project-1",
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: null,
      };
      const { values } = setupInsert([row]);

      const res = await POST(
        makeRequest({
          entityType: "note",
          operation: "create",
          entityId: "local-note-abc",
          projectId: "project-1",
          payload,
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(200);
      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Shopping list",
          contents: "Milk, eggs, bread",
          format: "text",
          projectId: "project-1",
          createdBy: "user-1",
        }),
      );
    });

    it("update: updates name, contents, format and sets updatedBy", async () => {
      mockFindFirst.notes.mockResolvedValue({
        id: "note-1",
        projectId: "project-1",
        updatedAt: new Date(NOW - 1000),
      });
      const row = {
        id: "note-1",
        name: "Updated",
        contents: "New content",
        format: "text",
        projectId: "project-1",
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: "user-1",
      };
      const { set } = setupUpdate([row]);

      await POST(
        makeRequest({
          entityType: "note",
          operation: "update",
          entityId: "note-1",
          projectId: "project-1",
          payload: { name: "Updated", contents: "New content", format: "text" },
          clientTimestamp: NOW,
        }),
      );

      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Updated",
          contents: "New content",
          format: "text",
          updatedBy: "user-1",
        }),
      );
    });

    it("delete: removes note", async () => {
      setupDelete();

      const res = await POST(
        makeRequest({
          entityType: "note",
          operation: "delete",
          entityId: "note-1",
          projectId: "project-1",
          payload: {},
          clientTimestamp: NOW,
        }),
      );

      expect(await res.json()).toMatchObject({ deleted: true });
    });
  });

  // ---- Pot ----

  describe("pot", () => {
    it("create: inserts pot then inserts member associations", async () => {
      const createdPot = {
        id: "pot-sv",
        name: "Trip",
        projectId: "project-1",
        createdBy: "user-1",
        createdAt: new Date(),
        settledAt: null,
      };

      let callCount = 0;
      mockDbInsert.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([createdPot]),
            }),
          };
        }
        return { values: vi.fn().mockResolvedValue(undefined) };
      });

      // Exact payload from offline-spendings.ts createPotOffline
      const res = await POST(
        makeRequest({
          entityType: "pot",
          operation: "create",
          entityId: "local-pot",
          projectId: "project-1",
          payload: { name: "Trip", memberIds: ["user-1", "user-2"] },
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(200);
      expect(mockDbInsert).toHaveBeenCalledTimes(2); // pots + potToUsers
    });

    it("create: skips potToUsers insert when memberIds is empty", async () => {
      const createdPot = {
        id: "pot-sv",
        name: "Solo",
        projectId: "project-1",
        createdBy: "user-1",
        createdAt: new Date(),
        settledAt: null,
      };
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdPot]),
        }),
      });

      const res = await POST(
        makeRequest({
          entityType: "pot",
          operation: "create",
          entityId: "local-pot",
          projectId: "project-1",
          payload: { name: "Solo", memberIds: [] },
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(200);
      expect(mockDbInsert).toHaveBeenCalledTimes(1);
    });

    it("delete: removes pot", async () => {
      setupDelete();

      const res = await POST(
        makeRequest({
          entityType: "pot",
          operation: "delete",
          entityId: "pot-1",
          projectId: "project-1",
          payload: {},
          clientTimestamp: NOW,
        }),
      );

      expect(await res.json()).toMatchObject({ deleted: true });
    });
  });

  // ---- Spending ----

  describe("spending", () => {
    it("create: converts amount from euros to cents (× 100)", async () => {
      // offline-spendings.ts enqueues raw euro amount; sync API multiplies by 100
      const row = {
        id: "sp-1",
        amount: 1250,
        currency: "EUR",
        description: "Lunch",
        from: "user-1",
        to: "user-2",
        potId: "pot-1",
        projectId: "project-1",
        createdBy: "user-1",
        createdAt: new Date(),
      };
      const { values } = setupInsert([row]);

      const res = await POST(
        makeRequest({
          entityType: "spending",
          operation: "create",
          entityId: "local-sp",
          potId: "pot-1",
          payload: {
            amount: 12.5,
            description: "Lunch",
            from: "user-1",
            to: "user-2",
          },
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(200);
      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1250,
          currency: "EUR",
          from: "user-1",
          to: "user-2",
          potId: "pot-1",
          createdBy: "user-1",
        }),
      );
    });

    it("create: amount conversion rounds correctly (10.99 → 1099)", async () => {
      const row = {
        id: "sp-1",
        amount: 1099,
        currency: "EUR",
        description: null,
        from: "user-1",
        to: null,
        potId: "pot-1",
        projectId: "project-1",
        createdBy: "user-1",
        createdAt: new Date(),
      };
      const { values } = setupInsert([row]);

      await POST(
        makeRequest({
          entityType: "spending",
          operation: "create",
          entityId: "local-sp",
          potId: "pot-1",
          payload: {
            amount: 10.99,
            description: null,
            from: "user-1",
            to: null,
          },
          clientTimestamp: NOW,
        }),
      );

      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 1099 }),
      );
    });

    it("create: returns 404 when pot does not exist", async () => {
      mockGetPot.mockResolvedValue(null);

      const res = await POST(
        makeRequest({
          entityType: "spending",
          operation: "create",
          entityId: "local-sp",
          potId: "nonexistent",
          payload: { amount: 10, from: "user-1", to: "user-2" },
          clientTimestamp: NOW,
        }),
      );

      expect(res.status).toBe(404);
    });

    it("delete: removes spending", async () => {
      setupDelete();

      const res = await POST(
        makeRequest({
          entityType: "spending",
          operation: "delete",
          entityId: "sp-1",
          potId: "pot-1",
          payload: {},
          clientTimestamp: NOW,
        }),
      );

      expect(await res.json()).toMatchObject({ deleted: true });
    });
  });
});
