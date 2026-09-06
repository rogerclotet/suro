import { act, cleanup, render, renderHook } from "@testing-library/react";
import type { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import {
  type FunctionReference,
  type FunctionReturnType,
  getFunctionName,
} from "convex/server";
import { StrictMode, useEffect } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useNoteEditLock } from "@/lib/queries/use-note-edit-lock";

const mutations = vi.hoisted(() => ({
  acquire: vi.fn(),
  renew: vi.fn(),
  release: vi.fn(),
}));
vi.mock("convex/react", () => ({
  useMutation: (ref: FunctionReference<"mutation">) => {
    switch (getFunctionName(ref)) {
      case "noteEditLocks:acquire":
        return mutations.acquire;
      case "noteEditLocks:renew":
        return mutations.renew;
      case "noteEditLocks:release":
        return mutations.release;
      default:
        throw new Error("Unexpected mutation");
    }
  },
}));
const noteId = "note" as Id<"notes">;
type Lease = NonNullable<FunctionReturnType<typeof api.noteEditLocks.acquire>>;
function lease(): Lease {
  return {
    lockId: "lock" as Id<"noteEditLocks">,
    expiresAt: Date.now() + 60_000,
    note: {
      _id: noteId,
      _creationTime: Date.now(),
      projectId: "project" as Id<"projects">,
      createdBy: "user" as Id<"users">,
      name: "Note",
      contents: "",
      format: "html",
      updatedAt: Date.now(),
    },
  };
}
async function settle() {
  await act(async () => {});
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  mutations.acquire.mockImplementation(async () => lease());
  mutations.release.mockResolvedValue(null);
  mutations.renew.mockImplementation(async () => Date.now() + 60_000);
});
afterEach(async () => {
  cleanup();
  await settle();
  vi.useRealTimers();
});

it("acquires successfully through Strict Mode's effect restart", async () => {
  const { result, unmount } = renderHook(() => useNoteEditLock(noteId), {
    wrapper: StrictMode,
  });
  await settle();
  expect(result.current.kind).toBe("editing");
  expect(mutations.acquire).toHaveBeenCalledTimes(1);
  unmount();
  await settle();
  expect(mutations.release).toHaveBeenCalledExactlyOnceWith({ lockId: "lock" });
});

it("never opens a blocked editor", async () => {
  mutations.acquire.mockResolvedValue(null);
  const { result } = renderHook(() => useNoteEditLock(noteId));
  await settle();
  expect(result.current).toEqual({ kind: "blocked" });
  expect(mutations.renew).not.toHaveBeenCalled();
});

it("keeps the draft session but disables editing when its lease expires offline", async () => {
  mutations.renew.mockImplementation(() => new Promise(() => {}));
  const { result } = renderHook(() => useNoteEditLock(noteId));
  await settle();
  const original = result.current;
  await act(async () => vi.advanceTimersByTime(60_000));
  expect(result.current).toEqual({ ...original, valid: false });
});

it("releases an acquisition that completes after navigation", async () => {
  let resolve: (value: Lease) => void = () => {
    throw new Error("Acquire has not started");
  };
  mutations.acquire.mockImplementation(
    () =>
      new Promise<Lease>((done) => {
        resolve = done;
      }),
  );
  const { unmount } = renderHook(() => useNoteEditLock(noteId));
  await settle();
  unmount();
  await act(async () => resolve(lease()));
  expect(mutations.release).toHaveBeenCalledExactlyOnceWith({ lockId: "lock" });
});

it("enqueues the child's final autosave before releasing", async () => {
  const calls: string[] = [];
  mutations.release.mockImplementation(async () => {
    calls.push("release");
  });
  function Editor() {
    useEffect(
      () => () => {
        calls.push("save");
      },
      [],
    );
    return null;
  }
  function Screen() {
    const lock = useNoteEditLock(noteId);
    return lock.kind === "editing" ? <Editor /> : null;
  }
  const { unmount } = render(<Screen />);
  await settle();
  unmount();
  await settle();
  expect(calls).toEqual(["save", "release"]);
});
