import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks ---

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: mockAuth }));

const mockGetUserProject = vi.fn();
vi.mock("@/server/projects", () => ({
  getUserProject: (...a: unknown[]) => mockGetUserProject(...a),
}));

const mockDbInsert = vi.fn();
vi.mock("@/server/db", () => ({
  db: {
    insert: (...a: unknown[]) => mockDbInsert(...a),
  },
}));

const mockCapture = vi.fn();
vi.mock("@/lib/posthog-server", () => ({
  getPostHogServer: () => ({ capture: mockCapture }),
}));

vi.mock("@/server/notification-i18n", () => ({
  translateNotificationBody: vi.fn().mockResolvedValue(""),
}));

vi.mock("@/server/push", () => ({
  sendProjectNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// --- Helpers ---

const mockSession = { user: { id: "user-1" } };
const mockProject = {
  id: "project-1",
  name: "Project 1",
  users: [{ user: { id: "user-1" } }],
};

function setupInsert(rows: unknown[]) {
  const returning = vi.fn().mockResolvedValue(rows);
  const values = vi.fn().mockReturnValue({ returning });
  mockDbInsert.mockReturnValue({ values });
  return { values, returning };
}

const validData = { name: "My Template", description: "", items: [] };

const { createTemplate } = await import("./actions");

// ---

describe("createTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockGetUserProject.mockResolvedValue(mockProject);
    setupInsert([{ id: "template-1" }]);
  });

  it("throws a proper Error (not TypeError) when getUserProject returns null", async () => {
    mockGetUserProject.mockResolvedValue(null);

    await expect(createTemplate("project-1", validData)).rejects.toThrow(
      "The user is not part of the project",
    );
  });

  it("throws when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(createTemplate("project-1", validData)).rejects.toThrow(
      "Not logged in",
    );
  });

  it("returns the new template id on success", async () => {
    const result = await createTemplate("project-1", validData);
    expect(result).toBe("template-1");
  });

  it("inserts with the correct projectId and createdBy", async () => {
    const { values } = setupInsert([{ id: "template-1" }]);

    await createTemplate("project-1", validData);

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        createdBy: "user-1",
        name: "My Template",
      }),
    );
  });
});
