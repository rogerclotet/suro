# Architecture and feature guide

Suro has one backend and two clients. Convex owns persistence, permissions, authentication, notifications and storage. Both clients use its generated API; there is no separate REST service or application database.

## Ownership

| Responsibility | Location |
| --- | --- |
| Schema and public API | `packages/backend/convex/schema.ts` and domain query/mutation modules |
| Authorization and joins | `packages/backend/convex/model` |
| Expense arithmetic, recurrence, task ordering and aggregation | `packages/domain/src` |
| Shared visual values | `packages/design-tokens` |
| Web reactive adapters | `apps/web/src/lib/queries` and `app/_data` |
| Web project subscription and selection | `app/_components/projects-provider` |
| Native checklist behavior and presentation | `apps/mobile/src/features/lists` |
| Native offline persistence, replay and projections | `apps/mobile/src/lib/offline` |

Keep `domain` independent of Convex, React, native modules, storage and network calls. It takes typed inputs and returns values. Convex checks membership and validates external arguments before invoking those rules. The server's expense balances and settlement proposals are authoritative; mobile uses the same arithmetic to project pending changes.

Clients keep their own components and translations. Share pure behavior where it must agree across platforms. The web checklist and the native checklist need different interaction and rendering code.

## Adding a feature

1. Add schema fields and membership-gated queries/mutations in the backend. Run `pnpm --filter backend codegen` after schema/API changes.
2. Put rules used by multiple callers in `domain`. Keep queries and framework adapters near their clients.
3. Give each mutation a specific intent when it changes only part of an entity. `listItems.setCompleted` and `setCategory` preserve unrelated edits. Completion includes the observed due date so replay cannot advance the same recurring occurrence twice. The existing full-replacement `listItems.update` remains supported for installed clients and older queues.
4. Choose a query shape that fits the screen. The list dropdown consumes `ListSummary`; the selected checklist consumes `lists.get` through `useList`, including its linked event. Do not manufacture missing details in summary adapters.
5. Put user-facing strings in all three locale catalogs. Add focused tests for rules, authorization and behavior that crosses layers, then run the root checks.

The web project provider is the only owner of project selection effects. It derives a group from the route on group pages and uses an account-scoped preference elsewhere. An inaccessible route yields no selected project. Consumers read `useProjects()`; they do not copy projects into another store or restore preferences themselves. Existing-entity forms use the entity's ID and project context.

The native checklist composes row and sheet components, a draft editor hook, a scroll lifecycle hook and typed command hooks. Online optimistic commands and offline queue projections both use `overlayItems`. Keep focus-follow state in the checklist: asynchronous submission must not unmount the active add input between entries.

## Offline protocol changes

`operations.ts` is the catalog of queueable mutations. Each entry owns its API reference, runtime argument schema and create/update/delete behavior. The generated argument types constrain the schema output. `Operation` and `OutboxEntry` are discriminated unions; reducers narrow on `functionName`.

To add a queued command, add a catalog entry, implement its projection where appropriate and cover its replay behavior. A queued hook returns either a server result or an explicit queued result with a local ID. A local ID is not a server acknowledgement.

The outbox stores entries, account identity, the temporary-ID map and acknowledgements in one versioned snapshot. The original three storage slots migrate into version 1 without changing legacy replacement semantics. Invalid entries and unsupported versions go into quarantine and stay on the device until explicitly discarded. Query caches have a separate version: bump it when cached result shapes become incompatible. Never invalidate the outbox as a substitute for migrating queued writes.

Replay requires both connectivity and a confirmed server identity matching the queue owner. It remaps nested temporary IDs, persists failures, and acknowledges a successful create and its ID mapping together. Only a delete receiving the structured `NOT_FOUND` code counts as an already-completed no-op; missing membership remains an error. Retry and discard include dependent changes so children do not become orphaned. Account changes clear the previous account's queue and cached queries.

The replay tests use the real persistence and replay code with injected storage, identity, network state and a send function. They cover restart, legacy migration, unreadable records, dependency chains, failed writes, recovery and an account change during a request. Native storage and device interactions still need device testing.

Replay is not an exactly-once delivery guarantee. A crash after a server mutation succeeds but before its local acknowledgement can replay it. Recurring completion is guarded; create/settlement commands would need server-persisted operation keys for general deduplication. Keep that requirement explicit when introducing non-idempotent operations.

## Query scaling

The backend list test includes 120 weekly lists with 20 items each. Fetching summaries plus one detail returns less than one tenth of the JSON payload of `listByProject`. The summary query reads list documents without joining every item's history; the detail query only subscribes to the selected list's items.

This fixture measures payload shape, not production latency or Convex billing. `overviewByProject` still scans list items to determine completion, and expense views still aggregate spending history. Before adding counters or denormalized completion fields, measure document reads, result sizes and latency for real groups. If those scans become costly, introduce transactional counters and paginated history with explicit consistency tests. A response limit alone does not reduce the current scan.

Shared package changes must reach their consumers: `domain` affects web, backend and native releases; `design-tokens` affects web and native builds. Path filters, the native release gate, Docker workspace manifests and Next's transpilation configuration include those packages. A native release still requires a version bump and matching changelog entry.

## Migration retirement

The repository retains `packages/backend/scripts/migrate.mjs`, guarded `convex/migrations.ts`, `legacyId` fields/indexes and the backend's migration-only `postgres` dependency. Git history records migration tooling and category backfills, but does not establish that production reconciliation and rollback needs are finished.

Once that operational milestone is confirmed, remove the script, endpoints, fields/indexes, dependency and `MIGRATION_SECRET` together, regenerate the API, and verify migrated account linking, memberships, file access and row reconciliation. Until then, these are migration tools; application traffic remains Convex-only.
