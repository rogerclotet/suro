import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/app/_data/project";
import messages from "@/i18n/messages/en.json";
import GroupSettings from "./group-settings";

const mocks = vi.hoisted(() => ({
  mutation: vi.fn(),
  replace: vi.fn(),
  userId: "admin",
}));
const project: Project = {
  id: "group",
  name: "Family",
  createdBy: "admin",
  inviteToken: "invite",
  image: null,
  color: "blue",
  features: { secretSanta: false },
  categories: [],
  secretSantas: [],
  users: ["admin", "member"].map((id) => ({
    user: {
      id,
      name: id === "admin" ? "Anna" : "Marc",
      image: null,
      customImage: null,
      avatarColor: null,
    },
  })),
};
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => mocks.mutation,
  useQuery: () => [
    {
      ...project,
      _id: project.id,
      members: project.users.map(({ user }) => ({ ...user, _id: user.id })),
    },
  ],
}));
vi.mock("@/app/_state/project-state", () => ({
  useProjects: () => ({ projects: [project] }),
}));
vi.mock("@/lib/session", () => ({
  useSession: () => ({ data: { user: { id: mocks.userId } } }),
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  Link: () => null,
}));
vi.mock("@uidotdev/usehooks", () => ({
  useIsClient: () => true,
  useMediaQuery: () => true,
}));
vi.mock("@/app/[locale]/groups/_components/edit-project-button", () => ({
  default: () => null,
}));
vi.mock("@/app/[locale]/groups/_components/invite-button", () => ({
  default: () => null,
}));
vi.mock("@/app/[locale]/groups/_components/leave-button", () => ({
  default: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.userId = "admin";
  mocks.mutation.mockResolvedValue(null);
});
afterEach(cleanup);
function showSettings() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <GroupSettings projectId="group" />
    </NextIntlClientProvider>,
  );
}

describe("group settings confirmations", () => {
  it("shows members to everyone but restricts administration controls", () => {
    mocks.userId = "member";
    showSettings();
    expect(screen.getByText("Anna")).toBeTruthy();
    expect(screen.getByText("Marc")).toBeTruthy();
    expect(screen.getByText("Administrator")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remove Marc" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete group" })).toBeNull();
  });

  it("requires a separate confirmation before removing a member, and supports cancel", async () => {
    showSettings();
    expect(screen.queryByRole("button", { name: "Remove Anna" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove Marc" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(mocks.mutation).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.mutation).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Remove Marc" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove member" }));
    await waitFor(() =>
      expect(mocks.mutation).toHaveBeenCalledWith({
        projectId: "group",
        userId: "member",
      }),
    );
  });

  it("requires the exact full group name and clears confirmation on reopening", async () => {
    showSettings();
    fireEvent.click(screen.getByRole("button", { name: "Delete group" }));
    const input = screen.getByRole("textbox", { name: "Full group name" });
    const submit = screen.getByRole("button", { name: "Delete group" });
    expect(submit.hasAttribute("disabled")).toBe(true);
    for (const name of ["family", "Famil", "Family "]) {
      fireEvent.change(input, { target: { value: name } });
      expect(submit.hasAttribute("disabled")).toBe(true);
    }
    fireEvent.change(input, { target: { value: "Family" } });
    expect(submit.hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.mutation).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete group" }));
    expect(
      screen
        .getByRole("textbox", { name: "Full group name" })
        .getAttribute("value"),
    ).toBe("");
    fireEvent.change(screen.getByRole("textbox", { name: "Full group name" }), {
      target: { value: "Family" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Delete group" }));
    await waitFor(() =>
      expect(mocks.mutation).toHaveBeenCalledWith({
        projectId: "group",
        confirmationName: "Family",
      }),
    );
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/groups"));
  });

  it("keeps a failed deletion open so it can be retried", async () => {
    mocks.mutation.mockRejectedValueOnce(new Error("Offline"));
    showSettings();
    fireEvent.click(screen.getByRole("button", { name: "Delete group" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Full group name" }), {
      target: { value: "Family" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Delete group" }));
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Delete group" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
