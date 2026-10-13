import { describe, expect, it } from "vitest";
import appConfig from "../app.json";
import easConfig from "../eas.json";
import { DEFAULT_SITE_URL } from "../src/lib/urls";

/**
 * Share links are built from `EXPO_PUBLIC_SITE_URL` (or the urls.ts fallback),
 * while the OS only hands a link to the app when its host is registered in
 * app.json. The two lists drifted once: production shared suroapp.cat links
 * that opened the browser instead of the app.
 */
function sharedLinkHosts(): string[] {
  const siteUrls = Object.values(easConfig.build).flatMap((profile) =>
    "EXPO_PUBLIC_SITE_URL" in profile.env
      ? [profile.env.EXPO_PUBLIC_SITE_URL]
      : [],
  );
  return [
    ...new Set([DEFAULT_SITE_URL, ...siteUrls].map((url) => new URL(url).host)),
  ];
}

describe("app link configuration", () => {
  const hosts = sharedLinkHosts();

  it("registers every shared-link host as an iOS associated domain", () => {
    expect(appConfig.expo.ios.associatedDomains).toEqual(
      expect.arrayContaining(hosts.map((host) => `applinks:${host}`)),
    );
  });

  it("registers the same group paths for every host on Android", () => {
    const pathsByHost = new Map<string, string[]>();
    for (const filter of appConfig.expo.android.intentFilters) {
      for (const { host, pathPrefix } of filter.data) {
        pathsByHost.set(host, [...(pathsByHost.get(host) ?? []), pathPrefix]);
      }
    }

    const expectedPaths = ["/ca/grups", "/en/groups", "/es/grupos", "/groups"];
    for (const host of hosts) {
      expect(pathsByHost.get(host)?.toSorted(), host).toEqual(expectedPaths);
    }
  });
});
