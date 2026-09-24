# Architecture and feature guide

Suro has one backend and two clients. Convex owns persistence, permissions, authentication, notifications and storage. Both clients use its generated API; there is no separate REST service or application database.

## Ownership

| Responsibility | Location |
| --- | --- |
| Schema and public API | `packages/backend/convex/schema.ts` and domain query/mutation modules |
| Authorization and joins | `packages/backend/convex/model` |
| Expense arithmetic, calendar dates, recurrence, task ordering and aggregation | `packages/domain/src` |
| Shared visual values | `packages/design-tokens` |
| Web reactive adapters | `apps/web/src/lib/queries` and `app/_data` |
| Web project subscription and selection | `app/_components/projects-provider` |
| Native checklist behavior and presentation | `apps/mobile/src/features/lists` |
| Native offline persistence, replay and projections | `apps/mobile/src/lib/offline` |

Keep `domain` independent of Convex, React, native modules, storage and network calls. It takes typed inputs and returns values. Convex checks membership and validates external arguments before invoking those rules. The server's expense balances and settlement proposals are authoritative; mobile uses the same arithmetic to project pending changes. Both clients create a settlement draft from reviewed payment identities and amounts. A reorder preserves selection. Changes to participants or amounts require an explicit refresh, and new clients send the reviewed proposals for a transactional server check. Partial payments leave a pot open while any balance remains.

Clients keep their own components and translations. Share pure behavior where it must agree across platforms. The web checklist and the native checklist need different interaction and rendering code.

## Adding a feature

1. Add schema fields and membership-gated queries/mutations in the backend. Run `pnpm --filter backend codegen` after schema/API changes.
2. Put rules used by multiple callers in `domain`. Keep queries and framework adapters near their clients.
3. Give each mutation a specific intent when it changes only part of an entity. `listItems.setCompleted` and `setCategory` preserve unrelated edits. Completion includes the observed due date so replay cannot advance the same recurring occurrence twice. The existing full-replacement `listItems.update` remains supported for installed clients and older queues.
4. Choose a query shape that fits the screen. The list dropdown consumes `ListSummary`; the selected checklist consumes `lists.get` through `useList`, including its linked event. Do not manufacture missing details in summary adapters.
5. Put user-facing strings in all three locale catalogs. Add focused tests for rules, authorization and behavior that crosses layers, then run the root checks.

The web project provider is the only owner of project selection effects. It derives a group from the route on group pages and uses an account-scoped preference elsewhere. An inaccessible route yields no selected project. Consumers read `useProjects()`; they do not copy projects into another store or restore preferences themselves. Existing-entity forms use the entity's ID and project context.

The native checklist composes row and sheet components, a draft editor hook, a scroll lifecycle hook and typed command hooks. Online optimistic commands and offline queue projections both use `overlayItems`. Keep focus-follow state in the checklist: asynchronous submission must not unmount the active add input between entries.

Group ordering uses `projects.lastActivityAt`, with creation time as the fallback for groups without recorded activity. Content mutations call `recordProjectActivity` in the same transaction after authorization, including quiet list-item, note, calendar, file and expense edits. Recording activity does not create unread notifications. Opening a group does not change its activity timestamp. Mobile search filters the ordered groups locally by group name and all member names, including cached groups while offline.

## Calendar dates

`domain/events` owns date-only conversion, overlap rules, countdowns, upcoming-event selection and form date transitions. Clients own localized formatting and input controls. All-day events store UTC midnight boundaries with an exclusive end. Their dates must be reconstructed from UTC date parts before displaying or editing them locally. Timed events store instants, also with exclusive ends, so an event ending at midnight does not appear on the following day.

The create/update API continues to accept an inclusive all-day end for compatibility with installed clients and offline writes. The backend adds one UTC day using `normalizeEventEnd`. Query bounds cover both UTC date-only and local timed boundaries. Clients filter fetched events by local calendar days before displaying them.

New forms default to all-day. Switching to timed suggests the next local half-hour today or 09:00 on another selected date, with a one-hour duration. Changing the start time preserves duration. Changing dates preserves edited clock times, and toggling all-day remembers the latest timed draft. A fresh dialog starts from the selected date or the saved event.

## Offline protocol changes

`operations.ts` is the catalog of queueable mutations. Each entry owns its API reference, runtime argument schema and create/update/delete behavior. The generated argument types constrain the schema output. `Operation` and `OutboxEntry` are discriminated unions; reducers narrow on `functionName`.

To add a queued command, add a catalog entry, implement its projection where appropriate and cover its replay behavior. A queued hook returns either a server result or an explicit queued result with a local ID. A local ID is not a server acknowledgement.

The outbox stores entries, account identity, the temporary-ID map and acknowledgements in one versioned snapshot. The original three storage slots migrate into version 1 without changing legacy replacement semantics. Invalid entries and unsupported versions go into quarantine and stay on the device until explicitly discarded. Query caches have a separate version: bump it when cached result shapes become incompatible. Never invalidate the outbox as a substitute for migrating queued writes.

Replay requires both connectivity and a confirmed server identity matching the queue owner. It remaps nested temporary IDs in reference fields (`*Id`, `*Ids`, and expense `from`/`to`), leaves user text unchanged, persists failures, and acknowledges a successful create and its ID mapping together. Only a delete receiving the structured `NOT_FOUND` code counts as an already-completed no-op; missing membership remains an error. Retry and discard include dependent changes so children do not become orphaned. Account changes clear the previous account's queue and cached queries.

The replay tests use the real persistence and replay code with injected storage, identity, network state and a send function. They cover restart, legacy migration, unreadable records, dependency chains, failed writes, recovery an account change during a request, writes added during a flush, and temporary route IDs becoming server IDs. Native storage and device interactions still need device testing.

Expense pot creation, spending creation and settlement now use optional `operationId` arguments. Mobile persists these commands in the outbox even when online. Replay assigns and saves a UUID before the first send, including for existing queue entries. Operation IDs are opaque keys, not temporary document references. The server records the result and a hash of the request in `expenseOperations`, scoped to the authenticated user, in the same transaction as the write and its side effects. Retries return that result; reusing a key for different arguments is an error. Authorization still applies before a receipt is returned.

Receipts have no time-based expiry because devices may stay offline indefinitely. Account deletion removes them. Older installed clients can continue sending the original arguments, but writes without a key do not gain deduplication. A successful write sent before upgrade cannot be retroactively identified by a newly assigned key. Other queued mutations still have their existing replay semantics; this is not a general exactly-once delivery guarantee.

New settlement commands include `reviewedPayments`. A stale offline settlement fails without inserting payments and stays in the existing failed-write queue. Discard that failed command before opening a fresh settlement review. Legacy queues that lack reviewed proposals keep their original submission semantics.

## Event links

`model/eventLinks.ts` enforces one list, note and pot per event inside the write transaction, including migration writes. Repeating the same link succeeds; attaching a second resource of that kind or moving an already-linked resource fails. Unlink explicitly before moving a resource. All callers retain their authorization checks.

Historical duplicates may still exist. Event details keep their tolerant `first()` reads until those records are reconciled. Run the internal `events:auditLinkDuplicates` query with a `projectId` to list conflicts, then unlink the unwanted associations without deleting the resources. Audit all affected projects before tightening reads to `unique()`.

## Query scaling

The backend list test includes 120 weekly lists with 20 items each. Fetching summaries plus one detail returns less than one tenth of the JSON payload of `listByProject`. The summary query reads list documents without joining every item's history; the detail query only subscribes to the selected list's items.

The same 120-list, 2,400-item fixture now measures dashboard previews and list link candidates separately. Instrumentation counts documents returned by real database reads in `convex-test`, including repeated reads, rather than estimating reads from response size:

| Query | JSON bytes | Documents returned by DB calls |
| --- | ---: | ---: |
| Full lists with items | 552,117 | 2,641 |
| Dashboard previews, five favorites | 894 | 221 |
| Unlinked list candidates | 7,150 | 121 |

`lists.homePreviews` still scans the project's list documents, then reads items only for up to five favorites and the lists linked to up to five upcoming events. It returns completion counts, not items. The candidate queries scan resource documents without joining list items, pot members or users. Note candidates omit contents from the response, but still read note documents containing those contents. No query-cache or outbox invalidation is required because these are new query names.

These measurements do not establish production latency or Convex billing. `overviewByProject` still scans list items to determine completion, and expense views still aggregate spending history. Before adding counters or denormalized completion fields, measure document reads, result sizes and latency for real groups. If those scans become costly, introduce transactional counters and paginated history with explicit consistency tests. A response limit alone does not reduce the current scan.

Shared package changes must reach their consumers: `domain` affects web, backend and native releases; `design-tokens` affects web and native builds. Web/backend path filters, Docker workspace manifests and Next's transpilation configuration include those packages. Every root version bump with a matching top changelog entry triggers a native release, regardless of changed paths, including backend-only and web-only releases.

## Migration retirement

The repository retains `packages/backend/scripts/migrate.mjs`, guarded `convex/migrations.ts`, `legacyId` fields/indexes and the backend's migration-only `postgres` dependency. Git history records migration tooling and category backfills, but does not establish that production reconciliation and rollback needs are finished.

Once that operational milestone is confirmed, remove the script, endpoints, fields/indexes, dependency and `MIGRATION_SECRET` together, regenerate the API, and verify migrated account linking, memberships, file access and row reconciliation. Until then, these are migration tools; application traffic remains Convex-only.
