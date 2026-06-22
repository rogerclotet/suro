import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

function stubFetch(ok = true) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
    ok,
    status: ok ? 200 : 500,
    json: async () => ({}),
  }));
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("analytics.capture", () => {
  it("no-ops when POSTHOG_PROJECT_KEY is unset", async () => {
    vi.stubEnv("POSTHOG_PROJECT_KEY", "");
    const fetchMock = stubFetch();
    const t = convexTest(schema, modules);
    await t.action(internal.analytics.capture, {
      distinctId: "user_1",
      event: "list_created",
      properties: { projectId: "proj_1" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the event with the Convex user id as distinct_id and a server $lib", async () => {
    vi.stubEnv("POSTHOG_PROJECT_KEY", "phc_test");
    vi.stubEnv("POSTHOG_HOST", "https://custom.posthog.example");
    const fetchMock = stubFetch();
    const t = convexTest(schema, modules);
    await t.action(internal.analytics.capture, {
      distinctId: "user_42",
      event: "spending_created",
      properties: { projectId: "proj_9", split: "equal" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://custom.posthog.example/i/v0/e/");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({
      api_key: "phc_test",
      event: "spending_created",
      distinct_id: "user_42",
      properties: {
        projectId: "proj_9",
        split: "equal",
        $lib: "convex-server",
      },
    });
    expect(typeof body.timestamp).toBe("string");
  });

  it("falls back to the EU host when POSTHOG_HOST is unset", async () => {
    vi.stubEnv("POSTHOG_PROJECT_KEY", "phc_test");
    vi.stubEnv("POSTHOG_HOST", undefined);
    const fetchMock = stubFetch();
    const t = convexTest(schema, modules);
    await t.action(internal.analytics.capture, {
      distinctId: "u",
      event: "group_created",
    });
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://eu.i.posthog.com/i/v0/e/");
  });
});
