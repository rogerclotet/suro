import { describe, expect, it, vi } from "vitest";
import {
  isNetworkError,
  retryDelayMs,
  withTokenFetchRecovery,
} from "@/lib/auth-token-fetcher";

const offline = () =>
  new Error(
    'fetch failed: java.net.UnknownHostException: Unable to resolve host "x.convex.cloud"',
  );

describe("isNetworkError", () => {
  it("matches expo/fetch failures", () => {
    expect(isNetworkError(offline())).toBe(true);
  });

  it("matches browser and RN fetch failures", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new TypeError("Network request failed"))).toBe(true);
  });

  it("rejects other errors", () => {
    expect(isNetworkError(new Error("InvalidRefreshToken"))).toBe(false);
    expect(isNetworkError("fetch failed")).toBe(false);
  });
});

describe("retryDelayMs", () => {
  it("backs off exponentially up to 30s", () => {
    expect([0, 1, 2, 5, 10].map(retryDelayMs)).toEqual([
      1_000, 2_000, 4_000, 30_000, 30_000,
    ]);
  });
});

describe("withTokenFetchRecovery", () => {
  const args = { forceRefreshToken: true };

  it("passes the token through", async () => {
    const fetcher = withTokenFetchRecovery(async () => "jwt", {
      onError: vi.fn(),
    });
    await expect(fetcher(args)).resolves.toBe("jwt");
  });

  it("retries network failures until the fetch succeeds", async () => {
    const fetchToken = vi
      .fn()
      .mockRejectedValueOnce(offline())
      .mockRejectedValueOnce(offline())
      .mockResolvedValue("jwt");
    const sleep = vi.fn(async () => {});
    const onError = vi.fn();
    const fetcher = withTokenFetchRecovery(fetchToken, { onError, sleep });

    await expect(fetcher(args)).resolves.toBe("jwt");
    expect(fetchToken).toHaveBeenCalledTimes(3);
    expect(fetchToken).toHaveBeenCalledWith(args);
    expect(sleep.mock.calls).toEqual([[1_000], [2_000]]);
    expect(onError).not.toHaveBeenCalled();
  });

  it("retries other failures before succeeding", async () => {
    const fetchToken = vi
      .fn()
      .mockRejectedValueOnce(new Error("Server error"))
      .mockResolvedValue("jwt");
    const onError = vi.fn();
    const fetcher = withTokenFetchRecovery(fetchToken, {
      onError,
      sleep: vi.fn(async () => {}),
    });

    await expect(fetcher(args)).resolves.toBe("jwt");
    expect(fetchToken).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });

  it("reports and resolves null after three other failures", async () => {
    const error = new Error("Server error");
    const fetchToken = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(offline())
      .mockRejectedValue(error);
    const onError = vi.fn();
    const sleep = vi.fn(async () => {});
    const fetcher = withTokenFetchRecovery(fetchToken, { onError, sleep });

    await expect(fetcher(args)).resolves.toBeNull();
    // The network failure in between doesn't count toward the limit.
    expect(fetchToken).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls).toEqual([[1_000], [2_000], [4_000]]);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(error);
  });
});
