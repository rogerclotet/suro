import { afterEach, describe, expect, it } from "vitest";
import {
  clearPendingInvitation,
  invitationRoute,
  pendingInvitation,
  rememberPendingInvitation,
} from "./pending-invitation";

afterEach(clearPendingInvitation);

describe("pending invitation", () => {
  it("has nothing to resume by default", () => {
    expect(pendingInvitation()).toBeNull();
  });

  it("builds the route webPathToRoute resolves invite links to", () => {
    expect(invitationRoute("project1", "token1")).toBe(
      "/invitation/project1/token1",
    );
  });

  it("keeps the remembered invitation across reads until cleared", () => {
    const route = invitationRoute("project1", "token1");
    rememberPendingInvitation(route);

    // Login reads this on every render while it redirects; a read must not
    // consume it, or a re-render would fall back to the groups list.
    expect(pendingInvitation()).toBe(route);
    expect(pendingInvitation()).toBe(route);

    clearPendingInvitation();
    expect(pendingInvitation()).toBeNull();
  });

  it("resumes the most recent invitation", () => {
    rememberPendingInvitation(invitationRoute("project1", "token1"));
    rememberPendingInvitation(invitationRoute("project2", "token2"));

    expect(pendingInvitation()).toBe("/invitation/project2/token2");
  });
});
