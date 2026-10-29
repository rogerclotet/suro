// @vitest-environment node

import { describe, expect, it } from "vitest";
import { rejectFormPost } from "@/lib/form-post-guard";

function request(
  path: string,
  init: { method?: string; headers?: Record<string, string> } = {},
): Request {
  return new Request(`https://suroapp.cat${path}`, {
    method: init.method ?? "POST",
    headers: init.headers,
    body: init.method === "GET" ? undefined : "garbage",
  });
}

const multipart = { "content-type": "multipart/form-data; boundary=abc" };

describe("form post guard", () => {
  it("rejects multipart page POSTs that aren't server-action calls", () => {
    for (const path of [
      "/",
      "/ca",
      "/en/lists/abc",
      "/api/auth",
      "/api/nope",
    ]) {
      expect(
        rejectFormPost(request(path, { headers: multipart }))?.status,
      ).toBe(415);
    }
    const mixedCase = { "Content-Type": "Multipart/Form-Data; boundary=abc" };
    expect(rejectFormPost(request("/", { headers: mixedCase }))?.status).toBe(
      415,
    );
  });

  it("lets server-action calls through for Next to validate", () => {
    const headers = { ...multipart, "Next-Action": "7f00aa" };
    expect(rejectFormPost(request("/ca", { headers }))).toBeNull();
  });

  it("leaves other requests alone", () => {
    expect(
      rejectFormPost(
        request("/api/auth", {
          headers: { "content-type": "application/json" },
        }),
      ),
    ).toBeNull();
    expect(
      rejectFormPost(
        request("/ca", { headers: { "content-type": "application/json" } }),
      ),
    ).toBeNull();
    expect(rejectFormPost(request("/ca", { method: "GET" }))).toBeNull();
  });
});
