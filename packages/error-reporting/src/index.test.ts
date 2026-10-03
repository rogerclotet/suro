import { describe, expect, it } from "vitest";
import { anonymousError } from "./index";

describe("anonymous error reports", () => {
  it("keeps Convex log correlation without retaining the error payload", () => {
    const event = anonymousError({
      type: undefined,
      tags: { action: "create_note", userId: "private-user" },
      exception: {
        values: [
          {
            type: "Error",
            value:
              "[CONVEX M(notes:create)] [Request ID: d064ef901f7ec0b7] Server Error\n  Called by client",
          },
          {
            type: "ConvexError",
            value: "private note from person@example.com",
          },
        ],
      },
    });
    expect(event.tags).toEqual({
      action: "create_note",
      convex_request_id: "d064ef901f7ec0b7",
      convex_function: "notes:create",
      convex_function_type: "M",
    });
    expect(event.exception?.values?.[0]?.value).toBe(
      "Convex M(notes:create) failed",
    );
    expect(JSON.stringify(event)).not.toMatch(
      /private-user|private note|person@example.com/,
    );
  });

  it("retains the request ID from HTTP client errors without inventing a function name", () => {
    const event = anonymousError({
      type: undefined,
      exception: {
        values: [
          {
            type: "Error",
            value: "[Request ID: d064ef901f7ec0b7] Server Error",
          },
        ],
      },
    });
    expect(event.tags).toEqual({ convex_request_id: "d064ef901f7ec0b7" });
  });

  it("does not copy arbitrary messages or malformed correlation fields", () => {
    for (const value of [
      "User said [Request ID: d064ef901f7ec0b7]",
      "[CONVEX M(person@example.com)] [Request ID: d064ef901f7ec0b7] private note",
      "[CONVEX M(notes:create)] [Request ID: person@example.com] private note",
    ]) {
      const event = anonymousError({
        type: undefined,
        exception: { values: [{ value }] },
      });
      expect(event.tags).toBeUndefined();
      expect(event.exception?.values?.[0]?.value).toBe(
        "Error details omitted for privacy",
      );
    }
  });

  it("keeps symbolication data while excluding account, request and user content", () => {
    const event = anonymousError({
      type: undefined,
      event_id: "0123456789abcdef0123456789abcdef",
      release: "suro@abcdef0",
      environment: "production",
      user: {
        id: "private-id",
        email: "person@example.com",
        ip_address: "1.2.3.4",
      },
      request: {
        url: "https://suroapp.cat/invite/secret",
        headers: { cookie: "token=secret" },
        data: "private note",
      },
      breadcrumbs: [{ message: "private note" }],
      extra: { form: "private note" },
      contexts: { device: { name: "Someone's iPhone" } },
      transaction: "/groups/private-id",
      tags: { action: "create_note", userId: "private-id" },
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Could not save private note for person@example.com",
            stacktrace: {
              frames: [
                {
                  filename:
                    "https://suroapp.cat/_next/static/chunks/app.js?token=secret",
                  function: "saveNote",
                  lineno: 42,
                  colno: 7,
                  vars: { input: "private note" },
                  context_line: "private note",
                },
              ],
            },
          },
        ],
      },
      debug_meta: {
        images: [
          {
            type: "sourcemap",
            code_file: "app.js?secret",
            debug_id: "debug-id",
          },
        ],
      },
    });
    const payload = JSON.stringify(event);
    for (const secret of [
      "private-id",
      "person@example.com",
      "1.2.3.4",
      "secret",
      "private note",
      "Someone's iPhone",
    ]) {
      expect(payload).not.toContain(secret);
    }
    expect(event.exception?.values?.[0]?.stacktrace?.frames?.[0]).toMatchObject(
      { function: "saveNote", lineno: 42, colno: 7 },
    );
    expect(event.debug_meta?.images?.[0]).toEqual({
      type: "sourcemap",
      code_file: "app.js",
      debug_id: "debug-id",
    });
    expect(event.release).toBe("suro@abcdef0");
    expect(event.tags).toEqual({ action: "create_note" });
    expect(event.user).toEqual({ ip_address: "0.0.0.0" });
  });
});
