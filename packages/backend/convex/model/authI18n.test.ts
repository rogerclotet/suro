import { describe, expect, it } from "vitest";
import { localizeAuthEmail } from "./authI18n";

describe("localizeAuthEmail", () => {
  it("localizes the subject", () => {
    expect(localizeAuthEmail("subject", {}, "en")).toBe(
      "Your Suro sign-in code",
    );
    expect(localizeAuthEmail("subject", {}, "ca")).toBe(
      "El teu codi d'inici de sessió de Suro",
    );
    expect(localizeAuthEmail("subject", {}, "es")).toBe(
      "Tu código de inicio de sesión en Suro",
    );
  });

  it("interpolates the code in the body", () => {
    expect(localizeAuthEmail("body", { code: "123456" }, "en")).toContain(
      "123456",
    );
    expect(localizeAuthEmail("body", { code: "123456" }, "ca")).toContain(
      "123456",
    );
  });

  it("falls back to Catalan for unknown locales", () => {
    expect(localizeAuthEmail("subject", {}, "fr")).toBe(
      "El teu codi d'inici de sessió de Suro",
    );
  });
});
