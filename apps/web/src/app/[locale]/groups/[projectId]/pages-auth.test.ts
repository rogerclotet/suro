import { beforeEach, describe, expect, it, vi } from "vitest";
import NotesPage from "./notes/page";
import GiftIdeasPage from "./secret-santa/ideas/page";
import SecretSantaPage from "./secret-santa/page";

const checkAuth = vi.hoisted(() => vi.fn<() => Promise<void>>());

vi.mock("@/lib/check-auth", () => ({ checkAuth }));
// The client views subscribe to project queries that throw for signed-out
// callers, so the page must redirect before they could mount.
vi.mock("./notes/_components/create-note-button/create-note-button", () => ({
  default: () => null,
}));
vi.mock("./notes/_components/note-list", () => ({ default: () => null }));
vi.mock("./notes/_components/note-preview", () => ({
  NotePreviewSkeleton: () => null,
}));
vi.mock("./secret-santa/_components/secret-santa-view", () => ({
  default: () => null,
}));
vi.mock("./secret-santa/ideas/_components/gift-ideas-view", () => ({
  default: () => null,
}));

const params = Promise.resolve({ projectId: "project" });

describe.each([
  ["notes", NotesPage],
  ["secret santa", SecretSantaPage],
  ["gift ideas", GiftIdeasPage],
])("%s page", (_name, Page) => {
  beforeEach(() => {
    checkAuth.mockReset();
  });

  it("redirects signed-out visitors before rendering the view", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    checkAuth.mockRejectedValue(redirect);

    await expect(Page({ params })).rejects.toBe(redirect);
  });

  it("renders for signed-in members", async () => {
    checkAuth.mockResolvedValue(undefined);

    await expect(Page({ params })).resolves.toBeTruthy();
    expect(checkAuth).toHaveBeenCalledOnce();
  });
});
