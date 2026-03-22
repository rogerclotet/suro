import { describe, expect, it } from "vitest";
import { getNotificationDigestBody } from "./notification-digest-messages";

describe("getNotificationDigestBody", () => {
  it("formats completed item summaries", () => {
    expect(
      getNotificationDigestBody({
        actorName: "Roger",
        count: 5,
        listName: "Compra",
        type: "list_items_completed",
      }),
    ).toBe("Roger ha marcat 5 elements com a completats a la llista Compra");
  });

  it("formats singular item additions", () => {
    expect(
      getNotificationDigestBody({
        actorName: "Roger",
        count: 1,
        listName: "Compra",
        type: "list_items_added",
      }),
    ).toBe("Roger ha afegit 1 element a la llista Compra");
  });
});
