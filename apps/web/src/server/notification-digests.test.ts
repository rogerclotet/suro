import { describe, expect, it } from "vitest";
import { getNotificationDigestBody } from "./notification-digest-messages";

describe("getNotificationDigestBody", () => {
  it("formats completed item summaries in Catalan (default)", async () => {
    expect(
      await getNotificationDigestBody({
        actorName: "Roger",
        count: 5,
        listName: "Compra",
        type: "list_items_completed",
      }),
    ).toBe("Roger ha marcat 5 elements com a completats a la llista Compra");
  });

  it("formats singular item additions in Catalan (default)", async () => {
    expect(
      await getNotificationDigestBody({
        actorName: "Roger",
        count: 1,
        listName: "Compra",
        type: "list_items_added",
      }),
    ).toBe("Roger ha afegit 1 element a la llista Compra");
  });

  it("formats item additions in Spanish when locale is es", async () => {
    expect(
      await getNotificationDigestBody({
        actorName: "Roger",
        count: 3,
        listName: "Compra",
        type: "list_items_added",
        locale: "es",
      }),
    ).toBe("Roger ha añadido 3 elementos a la lista Compra");
  });

  it("formats item additions in English when locale is en", async () => {
    expect(
      await getNotificationDigestBody({
        actorName: "Roger",
        count: 1,
        listName: "Shopping",
        type: "list_items_added",
        locale: "en",
      }),
    ).toBe("Roger added 1 item to the list Shopping");
  });
});
