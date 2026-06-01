import { describe, expect, it } from "vitest";
import { isNetworkError } from "./is-network-error";

describe("isNetworkError", () => {
  it("matches the browser fetch-failure phrasings", () => {
    for (const message of [
      "Failed to fetch", // Chromium
      "Load failed", // WebKit
      "The network connection was lost", // iOS
      "NetworkError when attempting to fetch resource", // Firefox
      "network error", // seen on flaky mobile connections
    ]) {
      expect(isNetworkError(new TypeError(message))).toBe(true);
    }
  });

  it("matches errors named NetworkError regardless of message", () => {
    const error = new Error("boom");
    error.name = "NetworkError";
    expect(isNetworkError(error)).toBe(true);
  });

  it("matches duck-typed errors carrying the isNetworkError flag", () => {
    expect(isNetworkError({ isNetworkError: true })).toBe(true);
  });

  it("does not match genuine application errors", () => {
    expect(
      isNetworkError(new Error("Cannot read properties of undefined")),
    ).toBe(false);
    expect(isNetworkError(new TypeError("x is not a function"))).toBe(false);
  });

  it("does not match non-error values", () => {
    expect(isNetworkError(undefined)).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError("network error")).toBe(false);
  });
});
