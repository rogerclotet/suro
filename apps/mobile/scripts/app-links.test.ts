import { describe, expect, it } from "vitest";
import appConfig from "../app.json";
import easConfig from "../eas.json";
import { DEFAULT_SITE_URL } from "../src/lib/urls";

/**
 * Share links are built from `EXPO_PUBLIC_SITE_URL` (or the urls.ts fallback),
 * while the OS only hands a link to the app when its host is registered in
 * app.json. The two lists drifted once: production shared suroapp.cat links
 * that opened the browser instead of the app. They must match exactly, so a
 * retired domain (suro.clotet.dev) is not kept registered either.
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

  it("registers exactly the shared-link hosts as iOS associated domains", () => {
    expect(appConfig.expo.ios.associatedDomains.toSorted()).toEqual(
      hosts.map((host) => `applinks:${host}`).toSorted(),
    );
  });

  it("registers exactly the shared-link hosts, with the group paths, on Android", () => {
    const pathsByHost = new Map<string, string[]>();
    for (const filter of appConfig.expo.android.intentFilters) {
      for (const { host, pathPrefix } of filter.data) {
        pathsByHost.set(host, [...(pathsByHost.get(host) ?? []), pathPrefix]);
      }
    }

    expect([...pathsByHost.keys()].toSorted()).toEqual(hosts.toSorted());
    const expectedPaths = ["/ca/grups", "/en/groups", "/es/grupos", "/groups"];
    for (const host of hosts) {
      expect(pathsByHost.get(host)?.toSorted(), host).toEqual(expectedPaths);
    }
  });
});
