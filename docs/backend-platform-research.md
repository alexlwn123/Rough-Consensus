# Backend platform research

Researched 2026-09-14 against current first-party documentation. This research preceded implementation; see [migration status](convex-migration-status.md) for subsequently provisioned services and imported data. Some Neon documentation pages failed in the web reader; their official `.md` versions were read directly instead. Prices and limits must be rechecked when implementing.

## Recommendation for this application

**Use Convex, on the existing Convex team, and reuse the authentication approach already established in the user's other Convex projects.** The user clarified that the objectives are technology consolidation and avoiding the dashboard work required to revive an infrequently used Supabase Free project. Those objectives outweigh preserving PostgreSQL for this small application.

The repo has four application tables (`debates`, `votes`, `user_roles`, `debate_access`), GitHub and Google OAuth, SQL functions for access registration and vote aggregation, and realtime debate/vote subscriptions. There is no active Storage or Edge Functions dependency. Existing vote subscriptions refetch aggregation RPCs after row changes. Convex's reactive queries directly fit that behavior: it tracks query dependencies and updates subscribed clients when data changes. [Convex realtime](https://docs.convex.dev/realtime)

If there is no existing auth standard, **evaluate Better Auth through the official Convex component first**, with a short OAuth/import proof before committing. Avoid adding Clerk merely because it is a familiar tutorial default. Convex Auth remains a viable option for an established existing deployment, but its official documentation still labels it beta. [Convex authentication](https://docs.convex.dev/auth/overview), [Convex + Better Auth](https://labs.convex.dev/better-auth)

Neon plus an application API is the fallback if preserving SQL, PostgreSQL constraints, or portability becomes a stronger priority than consolidation. It solves idle wakeup differently and well, but introduces another database provider plus a realtime transport decision.

## Inactivity and availability: what is actually documented

| Platform | Documented behavior | Consequence here |
| --- | --- | --- |
| Supabase Free | Low activity over seven days can cause automatic pausing. A paused project requires dashboard resume; the documented restore window is currently one year. | Explains the operational annoyance. The present inactivity threshold is one week, even if the app was discovered paused months later. |
| Supabase paid | Paid projects are not subject to automatic inactivity pausing. | Paying is the smallest change if pausing were the only concern, but does not consolidate technology. |
| Convex | Documentation describes manual pause and usage-limit enforcement. The researched pages do **not** state an inactivity-pausing rule or an explicit contractual guarantee that Free deployments never pause. | Do not promise "Convex can never pause." Confirm the existing team plan, available quota, and configured disabling thresholds. Validate an initial request after an idle interval. |
| Neon | Compute scales to zero after inactivity and automatically starts again when queried; the documentation describes reactivation within a few hundred milliseconds. | Automatic wakeup addresses the same idle-app problem, with a possible first-request delay. |

Sources: [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Convex pausing](https://docs.convex.dev/production/pause-deployment), [Convex usage limits](https://docs.convex.dev/production/usage-limits), [Neon scale to zero](https://neon.com/docs/introduction/scale-to-zero).

Convex Free can return errors when resource limits are exceeded. Starter permits usage beyond included resources, and Professional also permits metered overages. Quotas are measured across the **whole team**, not separately for every project. Because the user already has several Convex projects, assess the marginal workload against their combined usage. A paid plan does not override an intentionally configured deployment-disabling usage limit. [Convex pricing FAQ](https://www.convex.dev/pricing/faq), [Convex usage limits](https://docs.convex.dev/production/usage-limits)

## Convex versus managed PostgreSQL

| Concern | Convex | Neon with an application API |
| --- | --- | --- |
| Live debate phase and totals | Reactive query subscriptions are built into the backend/client model. | Keep SQL; implement authenticated SSE/WebSockets or use bounded polling during active debates. Database replication by itself is not the UI subscription layer. |
| Vote correctness | One mutation can read the current debate phase and existing vote, validate access, and atomically update the relevant vote field. | Keep a unique constraint and perform phase validation plus vote write in one transaction with appropriate locking/isolation. |
| Authorization | Explicit checks inside every public query/mutation; share helpers for roles and debate access. | Explicit API checks; optionally retain RLS as defense in depth after replacing Supabase-specific identity functions. |
| Migration effort | Rewrite SQL functions and policies as TypeScript; map PostgreSQL identifiers into Convex's document model. | Reuse more schema and SQL, but still replace Supabase Auth, `auth.uid()`, PostgREST calls, and realtime integration. |
| Operational fit | One familiar backend platform for this user. | PostgreSQL is familiar and portable, but another service remains to operate. |
| Future portability | Data can be exported and Convex can be self-hosted; application code still depends on Convex APIs and semantics. | SQL schema, constraints, and standard dumps transfer between PostgreSQL hosts with fewer transformations. |

These are architectural assessments for this repository, based on [Convex realtime](https://docs.convex.dev/realtime), [Convex transaction guarantees](https://docs.convex.dev/database/advanced/occ), [Convex authorization](https://docs.convex.dev/auth/overview), [Neon Supabase migration](https://neon.com/docs/import/migrate-from-supabase), and [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html).

### Votes: preserve invariants, not the current client write shape

Convex guarantees serializable, atomic mutations and retries conflicting deterministic transactions. A compound index lookup for `(debateId, userId)` followed by insert-or-patch **inside the same mutation** is the intended migration design. The mutation must derive the user from the authenticated server context, read the live debate phase, and update only the permitted phase field. The caller should not send a trusted user ID or an old whole-vote object. This design is an inference from the transaction model, not an automatic schema-level uniqueness guarantee. [Convex OCC and atomicity](https://docs.convex.dev/database/advanced/occ)

An index does not by itself reproduce PostgreSQL `UNIQUE`. Convex's `.unique()` checks the query result and throws if multiple matches exist; the centralized transactional write path enforces uniqueness. Import scripts and admin tools must enforce the same rule. [Convex indexes](https://docs.convex.dev/database/reading-data/indexes/), [Convex Query API](https://docs.convex.dev/api/interfaces/server.Query)

Start with indexed aggregation of votes for one debate only if measured data sizes permit it. Avoid making every voter update one shared tally document without testing burst contention. If required by volume, use a maintained aggregate or sharded counters with a recomputation check. Reactive caching reduces duplicate calculation, but subscription updates still consume resources; it does not make arbitrary fanout free. [Convex realtime](https://docs.convex.dev/realtime), [Convex limits](https://docs.convex.dev/production/state/limits)

Core vote writes belong in mutations. Convex actions are for external services or Node-only operations; actions access the database through separate queries/mutations and are not automatically retried on failure. Do not split a vote's read-check-write across separate action calls. [Convex actions](https://docs.convex.dev/functions/actions)

## Authentication choice and identity migration

### Preferred order

1. **Reuse the user's working Convex auth standard**, if it supports both existing providers and safe import/linking. Reusing a pattern does not imply merging this application's user data or admin roles into another application.
2. **Better Auth + the official Convex component** if no standard exists. The first-party integration has a React/Vite guide and runs the auth backend on Convex. Its instructions require a compatible, pinned Better Auth version; the component has published breaking-change migration guides. Treat that as a maintained dependency requiring upgrade care, not as proof of a stability guarantee. [Vite integration](https://labs.convex.dev/better-auth/framework-guides/react), [component migration notes](https://labs.convex.dev/better-auth/migrations/migrate-to-0-10)
3. **Clerk or another supported managed provider** when already used, or when managed account administration and broader auth features justify another vendor. Convex supports OIDC-based authentication and documents Clerk, WorkOS, and Auth0 integrations. [Convex auth overview](https://docs.convex.dev/auth/overview)

Convex Auth explicitly supports this app's client-side React architecture and GitHub/Google OAuth, but is still described as beta. It need not be rejected if the user's other applications already run it successfully; avoid selecting it under the mistaken assumption that it has no maturity caveat. [Convex Auth](https://docs.convex.dev/auth/convex-auth)

### Required mapping

Supabase distinguishes its identity-row ID from `provider_id`, which identifies the upstream OAuth account. A user can have multiple identities. Export both `auth.users` and **all relevant `auth.identities`**, preserving `(provider, provider_id)` and the linkage to the old Supabase user UUID. Do not infer identity solely from current email or display name. [Supabase identities](https://supabase.com/docs/guides/auth/identities)

Better Auth's official Supabase migration guide imports users and provider accounts, mapping the external account from `identity_data.sub` or `provider_id`. It is a PostgreSQL-to-PostgreSQL example, **not a script that can be run unchanged against the Convex component**. Adapt the import into the component's supported storage interface and retain an explicit old-user-ID → app-user-ID → auth-user-ID mapping. The component recommends an app-table `authId` reference when maintaining a separate application user table. [Better Auth Supabase migration](https://better-auth.com/docs/guides/supabase-migration-guide), [component identity mapping](https://labs.convex.dev/better-auth/migrations/migrate-to-0-9/migrate-userid)

Migration acceptance cases:

- Existing GitHub-only and Google-only users recover their votes, access grants, ownership, and roles.
- Both providers of an already-linked account resolve to the same application user.
- Changed email and a private GitHub email do not produce a duplicate voter.
- Ordinary users cannot claim an imported admin account; unresolved/ambiguous mappings stop for review.
- New users can join, sign out, and sign in again without duplicate identity rows.

Plan for a new login at cutover. Preserve identity and application history; do not promise that Supabase refresh tokens or sessions transfer to another auth system. Configure and test both providers' callbacks and deployment domains. If production contains password, anonymous, or SSO users beyond the source code's OAuth surface, extend the migration before cutover.

A temporary Supabase Auth bridge is technically plausible through compatible JWT verification, but leaves Supabase as a runtime dependency and does not achieve the stated consolidation objective. Convex's custom-JWT integration accepts RS256 or ES256, so a legacy HS256 configuration would require additional work. [Convex custom JWT](https://docs.convex.dev/auth/advanced/custom-jwt)

## Data movement and rollback implications

Convex supports table imports from JSON/CSV, backup restore, and data exports. Its import/export overview currently labels the feature beta. A PostgreSQL dump is not directly a Convex import: transform tables, timestamps, nullable fields and references, retaining original UUIDs as stable external identifiers where existing URLs require them. Rehearse the exact transform and reconcile row counts, relationships and vote totals before a write freeze and final snapshot. [Convex import/export](https://docs.convex.dev/database/import-export)

Convex can be self-hosted using the same backend code. This provides an operational exit, but is distinct from moving the application to a different database model. JSON exports alone do not migrate application functions, auth flows or authorization logic. [Convex self-hosting](https://docs.convex.dev/self-hosting)

Neon's official Supabase guide uses `pg_dump` and `pg_restore`, with an unpooled source connection and ownership/ACL adjustments; logical replication is an option for reducing downtime. Supabase-specific auth functions and foreign-key dependencies still require deliberate replacement. For this occasional-use application, a tested write-freeze/snapshot cutover is a simpler proposed approach than continuous bidirectional synchronization. [Neon Supabase migration](https://neon.com/docs/import/migrate-from-supabase)

After any accepted Convex write, switching the frontend back to the old Supabase snapshot would lose that write. Rollback must either occur before opening writes or include a frozen export/reconciliation of all subsequent changes. Keep the old project and an independent backup until the chosen observation period passes.

## Cost and capacity checks

Snapshot from official pages; these are service rates, not an estimate of this application's bill.

| Item | Current published value |
| --- | --- |
| Convex Starter | $0 base, metered usage beyond included resources |
| Convex Professional | $25 per developer/month, plus applicable overages |
| Convex Free/Starter allowances relevant here | 1 million function calls/month; 0.5 GB database storage; 1 GB database I/O/month |
| Convex Starter overages, US region | $2.20 per million calls; $0.22 per GB database storage/month; $0.22 per GB database I/O |
| Convex Free/Starter concurrency | S16 class: 1,000 concurrent sessions and 16 concurrent mutations |
| Convex transaction bounds | 16 MiB read; 32,000 documents scanned; one second of user-code execution, excluding database operations |
| Neon Launch database | $0.106 per compute-unit-hour; $0.35 per GB-month storage; auth/API/realtime choices affect the complete stack cost |

Sources: [Convex pricing](https://www.convex.dev/pricing), [Convex limits](https://docs.convex.dev/production/state/limits), [Neon pricing](https://neon.com/pricing).

Measure peak simultaneous viewers, votes per second during phase openings, largest historical debate, and aggregate result size. Evaluate the existing Convex team's combined usage, not an isolated free allowance. Configure warning thresholds appropriate to the team and understand any disabling limits. Alerting after errors and misleading empty-result fallbacks should be handled explicitly in the migration.

## Alternative notes

Neon now offers managed Better Auth and additional backend features; describing it as only a database would be outdated. Its current auth overview still labels managed Better Auth beta. The December 2025 replacement of the older Stack Auth implementation means early-2025 Supabase-to-Neon auth tutorials target the wrong architecture. A portable alternative is a small application API running Better Auth against PostgreSQL, with realtime added deliberately. [Neon auth overview](https://neon.com/docs/auth/overview), [Neon auth architecture change](https://neon.com/blog/neon-auth-branchable-identity-in-your-database), [Better Auth database adapters](https://better-auth.com/docs/adapters/other-relational-databases)

An active Neon logical-replication subscriber prevents scale-to-zero. If Neon were selected for an occasional-use site, account for this before choosing a continuously running database-change stream merely to power live totals. [Neon logical replication notices](https://neon.com/docs/guides/logical-replication-neon)

Firebase, Appwrite, and self-hosted replacements are not justified by the clarified objective: they introduce another technology without consolidating the user's existing Convex applications. No broader market ranking is needed to make this repository's decision.
