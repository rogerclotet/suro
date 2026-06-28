// Native app store links, shared between the marketing badges and the
// in-app download banner so the URLs live in exactly one place.

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=dev.clotet.suro";

// Country-less smart link: Apple redirects each visitor to their own
// storefront and localizes the listing automatically. Hardcoding a country
// segment instead forces one store (and 404s where the app isn't sold).
export const APP_STORE_URL = "https://apps.apple.com/app/id6780486033";
