import { renderHook } from "@testing-library/react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProjects } from "@/app/_state/project-state";
import { createCategory } from "../../[listId]/_components/categories/actions";
import { useCategoryCreation } from "./use-category-creation";

vi.mock("../../[listId]/_components/categories/actions", () => ({
  createCategory: vi.fn(),
}));
vi.mock("@/app/_state/project-state", () => ({
  useProjects: vi.fn(),
}));
vi.mock("@/lib/session", () => ({
  useSession: () => ({ data: { user: { id: "user1" } } }),
}));
vi.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values?.name ? `${key}:${values.name}` : key,
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("posthog-js", () => ({
  default: { captureException: vi.fn() },
}));

const createCategoryMock = vi.mocked(createCategory);
const useProjectsMock = vi.mocked(useProjects);
const addCategory = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useProjectsMock.mockReturnValue({
    project: { id: "p1", categories: [] },
    addCategory,
  } as unknown as ReturnType<typeof useProjects>);
});

describe("useCategoryCreation", () => {
  it("creates the category, adds it to the store, and returns its id", async () => {
    createCategoryMock.mockResolvedValue("new-id");

    const { result } = renderHook(() => useCategoryCreation());
    const id = await result.current.createAndSelect("Dairy");

    expect(id).toBe("new-id");
    expect(addCategory).toHaveBeenCalledWith({
      id: "new-id",
      name: "Dairy",
      projectId: "p1",
    });
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("reports the failure and rethrows when creation fails", async () => {
    const error = new Error("boom");
    createCategoryMock.mockRejectedValue(error);

    const { result } = renderHook(() => useCategoryCreation());

    await expect(result.current.createAndSelect("Dairy")).rejects.toThrow(
      "boom",
    );
    expect(addCategory).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(posthog.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ action: "create_category", projectId: "p1" }),
    );
  });
});
