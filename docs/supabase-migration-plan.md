# Supabase → Convex migration plan

Status: original design reviewed 2026-09-14 against commit `74f10fa`. Implementation, final import, OAuth verification, and public cutover are complete. See [current migration status and runbook](convex-migration-status.md) for the actual schema, auth choice, evidence, and remaining work. The sections below retain the original design rationale.

## Recommendation

**Move this app to Convex.** Alex already uses Convex across multiple projects and wants to consolidate technologies and avoid manually restoring an idle Supabase project between events. Those requirements outweigh the benefit of retaining PostgreSQL for this small application.

Keep React, Vite, React Router, Tailwind, and the existing results visualizations. Use a separate Convex project in the existing team. Reuse the authentication approach already established in Alex's other Convex projects if it supports GitHub and Google; that approach has not yet been inspected. If there is no established choice, evaluate Better Auth through the Convex-maintained component first. Its official guide supports this React/Vite SPA architecture. Clerk is a supported fallback if managed authentication is preferred. Convex Auth is a distinct library and remains beta; do not assume choosing Convex requires choosing Convex Auth. [Better Auth integration](https://labs.convex.dev/better-auth/framework-guides/react), [Clerk integration](https://docs.convex.dev/auth/clerk), [Convex Auth status](https://docs.convex.dev/auth/convex-auth).

### Alternatives considered

| Option | Fit for this app | Decision |
| --- | --- | --- |
| Convex + existing auth convention | Consolidates the stack; reactive queries and transactional TypeScript functions suit phases, ballots, and results | Recommended |
| Managed PostgreSQL, e.g. Neon, + an application API + auth | Retains SQL, UUIDs, constraints, and much of the aggregation logic; still requires replacing Supabase Auth, API access, and subscriptions | Choose if SQL portability becomes a stronger requirement than consolidation |
| Supabase on a paid plan | Avoids an application rewrite and removes inactivity pausing | Reasonable if pausing were the only problem; does not meet the consolidation goal |

The alternative PostgreSQL design would expose authenticated application endpoints, preserve the `(debate_id, user_id)` unique constraint, and enforce voting rules in transactions. Phase/own-ballot refresh could start with short polling; push subscriptions would require another implementation choice. Merely changing the database connection URL would not replace Supabase's client API or auth.

### Availability and cost gate

Supabase's current documentation says free projects can pause after low activity over **seven days**, with manual dashboard restoration; paid projects are exempt. The remembered three months is not the documented inactivity threshold. [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).

The Convex documentation reviewed describes manual deployment pausing and hard resource caps on Free, but does not establish a contractual guarantee that an unused free project will remain available indefinitely. **Before cutover, verify the selected existing team's plan and inactivity policy; do not promise “free and never pauses” based on absence of a documented timeout.** The acceptance requirement is that normal use after a long idle period needs no dashboard intervention. [Convex pausing](https://docs.convex.dev/production/pause-deployment), [Convex limits](https://docs.convex.dev/production/state/limits).

Measure the incremental cost within the existing Convex team, including its other projects' consumption: quotas are shared across the team. Record the next event's expected audience, peak concurrent connections, voting burst, stored history, function calls, and bandwidth. Free has hard caps; Starter permits metered overages but retains its deployment class's concurrency limits. Pick the plan based on event headroom, not average monthly activity. [Pricing FAQ](https://www.convex.dev/pricing/faq), [deployment limits](https://docs.convex.dev/production/state/limits). Pricing and detailed alternatives are captured in [platform research](backend-platform-research.md).

## What actually needs migrating

This inventory comes from checked-in code and SQL, not an inspection of the live Supabase project. Export the live schema and configuration before implementation to detect drift.

| Dependency | Current implementation | Replacement |
| --- | --- | --- |
| Application data | `debates`, `votes`, `user_roles`, `debate_access` | Convex documents and indexes |
| Authentication | GitHub **and Google** OAuth, persisted Supabase sessions | Existing Convex auth convention, or Better Auth component |
| Access control | PostgreSQL row-level security; `auth.users` references | Shared authorization helpers in every public backend function |
| Debate discovery/access | `fetchDebates`, `fetchDebate`, `register_debate_access` | Authorized queries and idempotent join mutation |
| Voting/admin operations | Browser upserts votes and inserts/updates debates | Validated backend mutations |
| Results | `get_debate_vote_counts`, `get_debate_result_data` | One authorized result query and shared aggregation logic |
| Updates | Debate row subscription; two vote subscriptions that refetch RPC results | Reactive phase/own-ballot queries; results subscribed only when relevant |
| Public types | Derived directly from Supabase generated table/composite/session types | App-owned domain types and a small presentation mapping layer |

`get_debate_sankey_data` also exists in SQL/types, but the active results call uses `get_debate_result_data`. No active Supabase Storage or Edge Function calls were found. `src/services/firebase.ts` is an unreferenced leftover and Firebase is absent from package dependencies; it is not a second production backend migration.

Source areas: [Supabase service](https://github.com/alexlwn123/Rough-Consensus/blob/74f10fa/src/services/supabase.ts), [vote service](https://github.com/alexlwn123/Rough-Consensus/blob/74f10fa/src/services/voteService.ts), [auth context](../src/context/AuthContext.tsx), [debate provider](../src/context/DebateProvider.tsx), [admin page](../src/pages/AdminPage.tsx), [types](../src/types/index.ts), [SQL migrations](migrations/supabase).

## Preserve behavior, make enforcement explicit

The following are proposed backend rules, derived from the UI. They deliberately tighten discrepancies in the checked-in SQL. Confirm them in the first implementation checkpoint rather than blindly translating every existing permission.

- Phases are `scheduled → pre → ongoing → post → finished`. Preserve the admin UI's adjacent backward transitions as well as forward transitions; reopening voting preserves existing ballots. Use an expected phase/version on admin updates to reject stale concurrent commands.
- Each person has one ballot per debate, with independently optional pre/post choices: `for`, `against`, or `undecided`. Users can change the active phase's choice. Post voting requires an existing pre vote, matching `VotingSection`.
- Derive the voter from authenticated server identity. In the same transaction, check membership, current phase, option validity, and prior pre vote; update only the requested phase. A stale browser must not reopen or overwrite a closed phase.
- Creating debates and changing phases are admin-only, matching the admin UI. The current SQL is broader: authenticated users can create their own debates and creators retain an update policy. Treat this tightening as an explicit decision.
- Current `?id=<debate UUID>` invitations grant access to anyone signed in who possesses the ID. Preserve these links and the `active_debate_id` storage value. Do not silently replace this with a new invitation system. Reject nonexistent/deleted debates; join is idempotent. Revocable tokens can be a later feature.
- Members/admins can read active debates; finished debates and aggregate results support direct anonymous viewing. Preserve the existing signed-out home screen. Return only the caller's individual ballot; do not expose everybody's raw votes.
- Results become available at `finished`, matching `ResultsPanel`. Enforce this in the backend too. The current RPCs check debate existence but do not include an explicit caller-access/phase check, and the original vote SELECT policy exposes ballots to authenticated users.
- Exclude soft-deleted debates from normal discovery, joins, voting, and public results. Current list filtering already hides them, while direct fetching does not. Preserve the stored deletion flag; implementing the currently nonfunctional delete button is separate scope.

These observations are based on the migrations; live policies, grants, and triggers may differ. [Initial policies](migrations/supabase/20250501155030_twilight_darkness.sql), [access RPC](migrations/supabase/20250506000000_debate_access.sql), [result RPCs](migrations/supabase/20250502232656_remote_schema.sql), [voting rules in the UI](../src/components/voting/VotingSection.tsx), [results visibility](../src/components/results/ResultsPanel.tsx).

## Target design

### Data and identity

| Logical collection | Important fields/indexes |
| --- | --- |
| `appUsers` | Stable app identity; preserve `legacySupabaseUserId`, display name, original timestamps |
| `authIdentities` | Trusted issuer/subject or provider/account identity → app user; multiple identities may map to one user |
| `debates` | `publicId` holding existing UUID, metadata, phase, creator reference, original dates, deletion flag; indexes on public ID and phase/start time |
| `votes` | Debate and app-user references, nullable pre/post choice, original ID/time; index on `(debateId, userId)` and on debate |
| `debateAccess` | Debate/user references and original access date; indexes for user and `(debateId, userId)` |
| `userRoles` | App user and role; index on `(userId, role)` |

Auth-library tables belong to the chosen integration; keep them separate from app identity. Preserve original timestamps explicitly rather than substituting Convex `_creationTime`. Retain old IDs for audit/import mapping; use native Convex references internally. Keep the public debate UUID in URLs, and issue public UUIDs for newly created debates too.

Convex indexes do not replace SQL uniqueness constraints by themselves. Use an indexed lookup plus insert/update **inside one mutation**, through the only permitted write path, for ballots, membership, roles, and identity mappings. `.unique()` validates lookup cardinality; it does not declare a unique schema constraint. Convex's serializable transactions provide the concurrency foundation; test duplicate submissions against a real deployment. Imports must validate uniqueness too. [Transactions](https://docs.convex.dev/database/advanced/occ), [indexed reads and unique lookups](https://docs.convex.dev/database/reading-data).

### Backend functions and React integration

Queries: `users.me`, `debates.listVisible`, `debates.getByPublicId`, `votes.mine`, `results.get`.

Mutations: `debates.join`, `debates.create`, `debates.setPhase`, `votes.cast`. Keep import, identity reconciliation, and role bootstrap operations internal and unavailable to ordinary clients. Shared helpers enforce authenticated user, admin, and debate access consistently. Convex authorization belongs in these functions; RLS is not migrated automatically. [Authorization model](https://docs.convex.dev/auth/overview).

`votes.cast` accepts public debate ID, expected voting phase/version, and option. It does not accept a user ID, arbitrary ballot object, or caller-supplied counts. Add a ballot version if needed to reject conflicting edits from two tabs; a deliberate change after refreshing remains allowed. Never mark an offline/pending vote as recorded until acknowledged.

Keep `AuthContext` and `DebateContext` as small UI-facing interfaces, backed by Convex hooks. Subscribe separately to shared debate state and private own-ballot state. A phase change must update all open clients; an admin role/access change must invalidate relevant authorized queries. Use a result query that returns a restricted state before `finished` without reading ballots. After finish, compute counts and all nine pre/post flows in one indexed pass. Aggregate only ballots with both choices into the flows; count valid choices independently for pre/post totals. Preserve the distinction between `for` in votes and `pro` in the current chart result shape with one explicit mapping.

This matches the actual UI: totals/charts are hidden until the end, so live global counters are unnecessary. Reactive queries track dependencies and update subscribed clients; no custom `postgres_changes → RPC refetch` loop is needed. [Convex realtime](https://docs.convex.dev/realtime).

Start with indexed per-debate aggregation, measured against actual history and the next event's maximum size. If it approaches transaction/read limits, introduce a versioned, precomputed result snapshot or partitioned aggregation before launch. Avoid a single shared tally document updated by every ballot unless burst tests prove adequate: it can create transaction contention. Reopening a debate must hide/invalidate any finished snapshot. [Transaction limits](https://docs.convex.dev/production/state/limits).

## Delivery checkpoints

### 1. Establish migration inputs and prove the risky path

- Inspect the existing Convex team/plan and auth convention; verify idle availability policy and available quota across projects.
- Obtain a consistent live export of application tables and schema/policies/functions. Export the minimum auth identity metadata needed to preserve ownership and linked accounts, not session/access/refresh tokens.
- Count rows, check duplicate/orphan references, and record current per-debate totals and nine flow counts. Record malformed historical vote JSON separately; do not silently convert it to `undecided`.
- Prove GitHub and Google sign-in plus existing-user identity resolution, one authorized ballot mutation, and two-browser phase synchronization in a disposable development deployment.
- Set an event-sized test envelope and acceptance targets. Initial planning assumption: 1,000 simultaneous participants, a 100-vote/second burst, p95 acknowledged vote/phase visibility within two seconds, zero lost/duplicate acknowledged ballots. Replace these assumptions with actual event expectations before testing. The currently documented S16 class allows 1,000 concurrent sessions, so that provisional audience would exhaust its connection capacity before allowing for extra tabs/spectators; select a larger class or lower the verified audience envelope with meaningful headroom.

Exit: auth/identity mapping works, expected event load is defined, idle availability requirement is resolved, and the choice is still Convex.

### 2. Implement backend and import tooling

- Add schema, indexes, authorization helpers, queries, and mutations described above.
- Write a rerunnable importer using a migration manifest: source snapshot ID/checksums, per-table counts, legacy→new ID maps, batch progress, and validation results. Load users before dependent records; preserve nulls, timestamps, relationships, and historical IDs.
- Map each exported OAuth provider/account identity to its existing app user. Reconcile only after server-verified authentication. Never trust a legacy ID from the browser or use display name/email alone to transfer ballot ownership or admin privileges. Handle linked GitHub/Google identities and missing identities explicitly. Conflicts block automatic linkage and need manual reconciliation.
- Use supported auth adapter APIs or trusted server-side identity resolution; do not assume Supabase auth rows can be directly loaded into a different auth library. Test the chosen library's account-linking behavior rather than accepting defaults blindly.
- Expect users to sign in again; existing Supabase sessions are not portable. Keep users who never return so historical ballots remain attributed consistently.
- Recompute results and compare every debate to the source snapshot. Validate all reference mappings and uniqueness after each import. Convex imports use supported document formats; a PostgreSQL SQL dump requires transformation. [Import](https://docs.convex.dev/database/import-export/import), [export](https://docs.convex.dev/database/import-export/export).

Exit: a full rehearsal import passes identity, ownership, count, and aggregate parity checks.

### 3. Replace frontend dependencies

- Update provider setup, auth callbacks/login, the two contexts, home-page join/list behavior, admin operations, services, and app domain types.
- Preserve the existing `/debate/:debateId` route and old `?id=` invite behavior, including stored invite IDs through OAuth redirects.
- Retain existing chart components; consolidate result payload adaptation. Make loading/error/offline states visible and use error boundaries. Do not return zeros on backend failures as if they were real results.
- Replace Supabase-specific mocks and add backend authorization/concurrency coverage. Keep SDK details out of display components without building a generic multi-provider persistence framework.
- Remove the Supabase SDK, generated database types, active config, and unused Firebase service once all references are replaced. Retain old SQL in migration history through the rollback window. Update README, environment examples, and AGENTS.md's backend guidance as part of the implementation.

Exit: `pnpm test:run`, `pnpm lint`, `pnpm build`, and browser smoke tests pass; record pre-existing failures separately. Implementation checks are recorded in the [current migration status](convex-migration-status.md).

### 4. Rehearse cutover and rollback

Perform the migration between events, with a short write freeze rather than dual writes.

1. Deploy a maintenance screen and **block writes on the old backend itself**, including existing browser sessions and direct API requests. Stop admin changes and prevent auth registrations/identity-link changes during the final snapshot. Wait for in-flight writes to drain. A frontend environment switch alone is insufficient.
2. Take final consistent data/identity exports and an independently restorable backup. Rerun the rehearsed importer into the target production deployment with target public writes disabled.
3. Compare rows, references, identity mappings, roles, access records, every ballot, and all aggregate outputs. Test original public/invite links and anonymous finished results.
4. Switch the frontend deployment and OAuth callbacks to Convex/auth integration. Keep old-backend write rejection in place for stale clients. Confirm login and read behavior before opening target voting/admin writes.
5. Enable target writes; run a complete synthetic debate with two users and an admin. Verify close-vote races, reconnect, repeat submissions, and results. Record the cutover timestamp and source snapshot.

Before target writes open, rollback means restoring the old frontend/auth configuration and re-enabling source writes. **After target writes open, a frontend rollback alone loses accepted changes.** Freeze target writes, export and reconcile all new/changed users/identities, ballots, debates/phases, roles, and access records using legacy IDs and a cutover change manifest; validate parity before reopening Supabase. Prefer a forward fix if reverse identity migration cannot be proven. Rehearse this with synthetic post-cutover data in advance.

Retain the protected source backup and rollback instructions for at least 30 days and through one successful real event, whichever is later. A free Supabase project can pause during that window, so rollback must have an independently tested restore path rather than relying on its dashboard availability. Remove obsolete credentials and decommission the old project only after the retention/validation gates pass.

## Required acceptance checks

| Area | Evidence required |
| --- | --- |
| Auth continuity | Returning GitHub-only, Google-only, linked-account, and admin users resolve to correct historical ownership; unmatched/ambiguous identities cannot acquire someone else's account |
| Ballot correctness | Simultaneous initial submissions create one ballot; repeated same-choice submissions do not inflate counts; stale updates cannot overwrite the other phase; post without pre is rejected |
| Phase races | Vote racing phase close is accepted or rejected consistently with transaction order; finished ballots cannot change unless an admin reopens the relevant phase |
| Authorization | Guests/nonmembers/nonadmins cannot call protected operations directly; other users' raw ballots never appear in result payloads; hidden/deleted debate behavior matches policy |
| Results | All nine flows and pre/post totals match historical SQL output; zero votes, pre-only ballots, malformed-history handling, and reopened debates have defined behavior |
| User experience | Invite survives login; old URLs work; own ballot syncs across tabs; reconnect updates phase; failed/pending writes do not display “recorded” |
| Capacity/availability | Real deployment meets agreed burst/latency targets, has quota headroom, and works after idle without operator intervention; a short idle smoke test alone is not proof of a months-long policy |
| Recovery | Rerunning import does not duplicate records; source backup restores; rollback rehearsal preserves synthetic post-cutover writes |

Existing React tests mock Supabase/services and are useful UI coverage, not proof of real backend permissions or concurrency. Test those invariants separately against backend functions and a hosted development deployment.

## Effort and remaining inputs

Planning estimate: **5–8 focused engineering days**, assuming small data volume, accessible exports/OAuth configuration, and a reusable auth pattern: 1 day for inventory/proof, 2–3 for backend/import, 1–2 for frontend, and 1–2 for rehearsal/cutover. This is a scope estimate, not a commitment; identity anomalies or event-scale aggregation may extend it.

Inputs still needed during implementation: existing Convex auth convention/team plan, live Supabase schema and identity export, historical data volume, next event size/date, and an acceptable brief maintenance window. These do not prevent recommending Convex now. Start with checkpoint 1 and use its evidence to finalize the implementation estimate.
