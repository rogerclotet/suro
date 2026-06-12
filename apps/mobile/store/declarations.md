# Store console declarations

Single source of truth for the questionnaire answers in App Store Connect and
the Play Console. These describe the app **as currently shipped** (no ads, no
IAP, no analytics SDK in the native app). If that changes, update this file and
the consoles together — see [Future monetization](#future-monetization-iap--ads).

Derived from the privacy policy at https://suro.clotet.dev/en/privacy
(`apps/web/src/app/[locale]/_components/privacy-content.tsx`). The native app
talks only to the Convex backend (+ file storage); PostHog runs on the **web**
app only — the Expo app ships no analytics or crash SDK.

## ⚠️ Pre-submission blockers

- **In-app account deletion is not implemented in the mobile app.** Apple
  guideline 5.1.1(v) requires that apps supporting account creation let users
  initiate account deletion *in the app*; Google Play additionally requires a
  **web URL** where users can request deletion (linked from the Data safety
  form). The privacy policy promises full deletion on request, but a
  reviewer-visible flow must exist before submission. Track this as its own
  work item (profile screen → delete account + backend cascade + web request
  page).
- iOS distribution credentials on EAS are still pending (Apple Developer
  Program membership) — see `apps/mobile/README.md`.

## Google Play — Data safety form

**Does your app collect or share any of the required user data types?** Yes.

| Data type | Collected | Shared | Optional | Purpose |
| --- | --- | --- | --- | --- |
| Personal info → Name | Yes | No | Yes (defaults to email) | App functionality (shown to your group) |
| Personal info → Email address | Yes | No | No | App functionality (account, sign-in) |
| Photos and videos → Photos | Yes | No | Yes (only if the user uploads) | App functionality (group file sharing, avatars) |
| Files and docs | Yes | No | Yes (only if the user uploads) | App functionality (group file sharing) |
| Messages → Other in-app messages | Yes | No | Yes | App functionality (lists, notes, events, expenses shared with the group) |
| Device or other IDs | Yes | No | Yes (only with notifications enabled) | App functionality (Expo push token for notifications) |

- **Is all of the user data collected by your app encrypted in transit?** Yes
  (HTTPS/WSS to Convex).
- **Do you provide a way for users to request that their data is deleted?**
  Yes — full account deletion on request (privacy policy); web deletion URL
  required, see blockers above.
- **Data shared with third parties:** none. Processors (Convex hosting, Resend
  for sign-in emails) act on our behalf — that's "collected", not "shared", in
  Play's taxonomy.
- **Ads:** the app contains no ads → declare **No ads**. Do not pre-declare
  future ads; the form must match the shipped binary.

### Play content declarations (App content page)

- **Privacy policy URL:** https://suro.clotet.dev/en/privacy
- **App access:** the whole app requires sign-in → provide access credentials:
  the review account (`AUTH_REVIEW_EMAIL`) + fixed OTP (`AUTH_REVIEW_OTP`),
  with the note from [Review notes](#review-notes--demo-account).
- **Content rating (IARC questionnaire):** no violence, no sexuality, no
  profanity, no controlled substances, no gambling, no user-to-user
  *public* interaction (groups are private, invite-only), no sharing of user
  location → expected rating **Everyone / PEGI 3**.
- **Target audience:** 18+ (or 16+) — not directed at children; do NOT select
  any under-13 bracket (triggers Families policy).
- **News app:** No. **COVID-19 tracing/status:** No.
- **Data safety → Financial info:** none — the expenses feature stores
  user-entered amounts; no payment instruments, no transactions.
- **Government ID / Health:** none.

## Apple — App Privacy (nutrition labels)

All collected data is **linked to the user's identity** (it lives in their
account) and **not used for tracking** (no third-party advertising/data
brokers; answer "No" to tracking).

| Category | Data | Linked to user | Used for tracking | Purpose |
| --- | --- | --- | --- | --- |
| Contact info | Email address | Yes | No | App functionality |
| Contact info | Name | Yes | No | App functionality |
| User content | Photos or videos | Yes | No | App functionality |
| User content | Other user content (lists, notes, events, expenses, files) | Yes | No | App functionality |
| Identifiers | Device ID (Expo push token, only with notifications enabled) | Yes | No | App functionality |

Not collected: location, contacts, browsing/search history, health, financial
instruments, diagnostics, usage analytics (no analytics SDK in the native app).

### Other App Store Connect answers

- **Age rating questionnaire:** all "None" → **4+** (matches
  `apple.advisory` in `store.config.json`).
- **Export compliance:** uses only standard HTTPS/TLS →
  `ITSAppUsesNonExemptEncryption=false` is set in `app.json`, so no per-build
  prompt.
- **Content rights:** app contains only user-generated and first-party
  content.
- **EU Digital Services Act trader status:** non-trader (personal project, no
  monetization) — revisit when IAP/ads land.

## Review notes / demo account

Both consoles need working credentials because the entire app is behind
sign-in:

- Email: the value of `AUTH_REVIEW_EMAIL` (suggested: `review@suro.clotet.dev`)
- Code: the value of `AUTH_REVIEW_OTP` (pick a 6-digit code; set both env vars
  on the **production** Convex deployment: `npx convex env set ...`)
- Note for reviewers: *"Choose 'Continue with email', enter the demo email,
  then enter the one-time code provided here — this reviewer account uses a
  fixed code instead of an emailed one. The account is a member of a demo
  group with sample lists, calendar events, notes and shared expenses."*
- Stage the demo content with
  `npx convex run seed:demoGroup '{"email": "<review email>", "locale": "en"}'`.
- Mirror the values into `apple.review.demoUsername` / `demoPassword` in
  `store.config.json` **before** `eas metadata:push` (they are placeholders in
  git — don't commit the real code).

## User-generated content (both stores)

Suro hosts UGC within private, invite-only groups. Apple guideline 1.2 /
Play UGC policy questions: groups are private (no public discovery), members
join only via invite links, the group creator can manage the group, and any
account + its content can be deleted in full. There is no in-app reporting or
blocking today — acceptable for private-group apps, but note it if review asks.

## Future monetization (IAP / ads)

Planned but **not** declared until shipped. When it lands, flip in lockstep
with the release:

1. **Google Play:** Data safety (new SDK data types — e.g. advertising ID),
   "Contains ads" toggle, IARC re-rating (ads question), `Monetize → Products`
   for IAP/subscriptions.
2. **App Store Connect:** create IAP/subscription products; update App
   Privacy if an ads/analytics SDK collects identifiers or usage data; age
   rating unchanged unless ad content requires it; DSA trader status likely
   becomes "trader".
3. **This repo:** update this file, `store.config.json` descriptions if copy
   mentions pricing, and the privacy policy on the web (it currently states
   no advertising use of content).
4. Avoid "free", "no ads" claims in store copy (already avoided today).
