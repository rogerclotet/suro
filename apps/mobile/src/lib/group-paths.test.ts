import { describe, expect, it } from "vitest";
import {
  isLocale,
  localizeGroupPath,
  toCanonicalSegment,
  webPathToRoute,
} from "./group-paths";

const PID = "k1700000000000000000000000000000";
const TOKEN = "11111111-2222-3333-4444-555555555555";

describe("localizeGroupPath", () => {
  it("localizes an invite path for Catalan", () => {
    expect(localizeGroupPath("/groups/abc/invitation/tok", "ca")).toBe(
      "/ca/grups/abc/invitacio/tok",
    );
  });

  it("localizes an invite path for Spanish", () => {
    expect(localizeGroupPath("/groups/abc/invitation/tok", "es")).toBe(
      "/es/grupos/abc/invitacion/tok",
    );
  });

  it("keeps English segments but still prefixes the locale", () => {
    expect(localizeGroupPath("/groups/abc/invitation/tok", "en")).toBe(
      "/en/groups/abc/invitation/tok",
    );
  });

  it("localizes a calendar event path", () => {
    expect(localizeGroupPath("/groups/abc/calendar/e1", "ca")).toBe(
      "/ca/grups/abc/calendari/e1",
    );
  });

  it("localizes nested list template segments for Spanish", () => {
    expect(localizeGroupPath("/groups/abc/lists/templates/t1", "es")).toBe(
      "/es/grupos/abc/listas/plantillas/t1",
    );
  });

  it("coerces a regional locale tag to a supported locale", () => {
    expect(localizeGroupPath("/groups/abc", "en-GB")).toBe("/en/groups/abc");
  });

  it("round-trips through toCanonicalSegment", () => {
    const localized = localizeGroupPath("/groups/abc/invitation/tok", "es");
    const segments = localized.split("/").filter(Boolean).slice(1);
    expect(segments.map(toCanonicalSegment)).toEqual([
      "groups",
      "abc",
      "invitation",
      "tok",
    ]);
  });
});

describe("isLocale", () => {
  it("accepts supported locales", () => {
    expect(isLocale("ca")).toBe(true);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("en")).toBe(true);
  });

  it("rejects non-locale segments", () => {
    expect(isLocale("groups")).toBe(false);
    expect(isLocale("grups")).toBe(false);
  });
});

describe("toCanonicalSegment", () => {
  it("maps localized segments back to canonical", () => {
    expect(toCanonicalSegment("grups")).toBe("groups");
    expect(toCanonicalSegment("invitacion")).toBe("invitation");
    expect(toCanonicalSegment("amic-invisible")).toBe("secret-santa");
  });

  it("passes through canonical segments and ids", () => {
    expect(toCanonicalSegment("lists")).toBe("lists");
    expect(toCanonicalSegment("abc123")).toBe("abc123");
  });
});

describe("webPathToRoute", () => {
  it("maps the canonical app-shared invite path to the invite screen", () => {
    expect(webPathToRoute(`/groups/${PID}/invitation/${TOKEN}`)).toBe(
      `/invitation/${PID}/${TOKEN}`,
    );
  });

  it("maps a locale-prefixed Catalan invite link", () => {
    expect(webPathToRoute(`/ca/grups/${PID}/invitacio/${TOKEN}`)).toBe(
      `/invitation/${PID}/${TOKEN}`,
    );
  });

  it("maps a locale-prefixed Spanish invite link", () => {
    expect(webPathToRoute(`/es/grupos/${PID}/invitacion/${TOKEN}`)).toBe(
      `/invitation/${PID}/${TOKEN}`,
    );
  });

  it("leaves an invite link without a token unchanged", () => {
    expect(webPathToRoute(`/groups/${PID}/invitation`)).toBe(
      `/groups/${PID}/invitation`,
    );
  });

  it("strips the groups prefix for a canonical list link", () => {
    expect(webPathToRoute(`/groups/${PID}/lists/abc`)).toBe(
      `/${PID}/lists/abc`,
    );
  });

  it("translates localized Catalan list segments", () => {
    expect(webPathToRoute(`/ca/grups/${PID}/llistes/abc`)).toBe(
      `/${PID}/lists/abc`,
    );
  });

  it("translates nested localized Spanish template segments", () => {
    expect(webPathToRoute(`/es/grupos/${PID}/listas/plantillas/t1`)).toBe(
      `/${PID}/lists/templates/t1`,
    );
  });

  it("translates a localized calendar event link", () => {
    expect(webPathToRoute(`/es/grupos/${PID}/calendario/e1`)).toBe(
      `/${PID}/calendar/e1`,
    );
  });

  it("accepts a full absolute URL and strips the locale prefix", () => {
    expect(
      webPathToRoute(`https://suro.clotet.dev/en/groups/${PID}/files`),
    ).toBe(`/${PID}/files`);
  });

  it("routes a bare group link to the group home", () => {
    expect(webPathToRoute(`/groups/${PID}`)).toBe(`/${PID}/lists`);
  });

  it("falls back to the group home for features without a native screen", () => {
    expect(webPathToRoute(`/ca/grups/${PID}/amic-invisible`)).toBe(
      `/${PID}/lists`,
    );
  });

  it("leaves existing scheme-style invite paths unchanged", () => {
    expect(webPathToRoute(`/invitation/${PID}/${TOKEN}`)).toBe(
      `/invitation/${PID}/${TOKEN}`,
    );
  });

  it("leaves unrelated paths unchanged", () => {
    expect(webPathToRoute("/login")).toBe("/login");
  });
});
