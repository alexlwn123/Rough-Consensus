# Convex migration: status and cutover

Updated September 14, 2026 (US Eastern; September 15 UTC). **The public site is live on Convex: https://consensus.lwn.lol. Production writes are enabled, GitHub and Google login pass, and Supabase remains read-only.**

## Deployments

Project: [alex-lewin / rough-consensus](https://dashboard.convex.dev/t/alex-lewin/rough-consensus).

| Environment | Deployment               | Current write state                          |
| ----------- | ------------------------ | -------------------------------------------- |
| Development | `grateful-rabbit-649`    | Live for testing                             |
| Production  | `befitting-albatross-28` | Live; final snapshot verified |

Development URL: `https://grateful-rabbit-649.convex.cloud`. Production URL: `https://befitting-albatross-28.convex.cloud`.

The app uses Convex Auth, matching an existing project in this team. Its provider-account lookup was inspected in the installed library and tested through its internal OAuth completion mutation. The custom callback preserves imported ownership and disables automatic email-based account merging. Convex Auth is still [documented as beta](https://docs.convex.dev/auth/convex-auth).

## Source and verification

The live site's frontend configuration identifies Supabase project `jrgrsjkuihhsnwxcbwzn`. A consistent read-only SQL snapshot was taken at `2026-09-15T00:15:54.193806+00:00` using [export-supabase.sql](../scripts/export-supabase.sql).

Snapshot SHA-256: `2b474a7c49d879ea53ed8b7163fb820ea346f2e8aa8dd7c3863de383b316f22e`.

| Source data                        | Imported rows |
| ---------------------------------- | ------------: |
| Users                              |           346 |
| Provider identities                |           100 |
| Debates, including deleted history |            11 |
| Ballots                            |           192 |
| Debate access grants               |           352 |
| Roles                              |             2 |

The application backend is deployed to both environments. The final frozen source differed from the rehearsal only in export time. Production passed exact row and result parity before writes opened and again after cutover at `2026-09-15T00:19:36.520Z`. All 11 source SQL results matched, including deleted history.

Both deployments passed field-by-field reconstruction of all exported rows, relationship checks, and comparison of pre/post counts and all nine flows for every debate. The importer was rerun on development before writes opened; it produced no duplicates. After the hosted voting test and fixture cleanup, exact source parity passed again.

The 100 provider identities comprise 88 GitHub and 12 Google accounts mapped to 99 users. The remaining 247 users have no surviving provider identity in the source. Their history remains intact, but a future login cannot automatically reclaim it without a verified provider mapping. Both admin users have imported provider identities. Email or display-name matches never confer historical ownership or roles.

Private source and target snapshots and verification reports are under ignored `.migration/`, with restricted file permissions. They contain user data and must stay out of Git. The export does not contain passwords, sessions, refresh tokens, or provider access tokens. The minimal snapshot is sufficient for this app's data reconciliation; it is **not** a complete, independently restored Supabase backup.

## Implemented and exercised

- Native Convex references internally; original UUIDs, timestamps, nullable fields, ownership, and deletion flags retained.
- GitHub/Google provider accounts imported into the auth library's actual identity index. Tests cover linked providers, changed email, unknown same-email accounts, repeated logins, and migration locking.
- Server-side phase and membership checks, admin-only creation/phase changes, idempotent joins and ballots, version checks for stale edits, and post-vote prerequisites.
- Anonymous finished results and private own-ballot queries. Deleted debates are excluded. Results are computed only when finished.
- React contexts use reactive queries and mutations. Invitations survive login. Pending/offline/error states are explicit; a vote is not shown as recorded before acknowledgement.
- Supabase SDK, services, generated types, and unused Firebase service removed from the runtime. Chart components retain their existing result shape.

Hosted development verification used 50 synthetic voters with admin test identities and two real WebSocket subscriptions. Results: vote acknowledgement p95 **185 ms**; both subscribers observed the phase change within **192 ms**. Concurrent same-user initial submissions, stale edits, a phase-close race, post voting, and finished totals passed. Synthetic fixtures were removed, and historical rows/results remained identical. This tests application behavior under a small burst; it does not establish a 1,000-person event capacity. External OAuth was tested separately in real browsers.

Validation: `pnpm test:run` passed 25 frontend and 24 backend tests. `pnpm lint` passed ESLint and both TypeScript projects, with the existing React fast-refresh export warning. `pnpm build` passed, with an outdated Browserslist database warning. No Supabase or Firebase runtime references remain in `src`, `shared`, or `convex`.

## OAuth configuration and acceptance

Deployment secrets are already configured: `JWT_PRIVATE_KEY`, `JWKS`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET`. Each deployment has a separate signing key. `SITE_URL` is `http://localhost:5173` in development and `https://consensus.lwn.lol` in production. The frontend requests a return to its current origin. The backend permits only `/auth/callback` on `SITE_URL` or exact `AUTH_ALLOWED_ORIGINS`; lookalike hosts, different ports/protocols, credentials, and injected query strings are rejected. Development additionally allows `http://127.0.0.1:5173` and the exact hosted preview below; production additionally allows the existing `rough-consensus.vercel.app` and `rough-consensus-alexlwn123-s-team.vercel.app` aliases. The `roughconsensus.xyz` domains already redirect to `consensus.lwn.lol`.

The local repository contained stale OAuth settings; configured credentials were selected by comparing provider client IDs against redirects from the live Supabase authorize endpoint. The user approved callback registration, and both providers have now saved these destinations while retaining the existing Supabase callbacks:

| Provider | Development callback                                               | Production callback                                                   |
| -------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| GitHub   | `https://grateful-rabbit-649.convex.site/api/auth/callback/github` | `https://befitting-albatross-28.convex.site/api/auth/callback/github` |
| Google   | `https://grateful-rabbit-649.convex.site/api/auth/callback/google` | `https://befitting-albatross-28.convex.site/api/auth/callback/google` |

The original errors were GitHub “Invalid Redirect URI” and Google `redirect_uri_mismatch`. Registering the Convex callbacks fixed both. Real GitHub and Google login passed on the development preview, staged production deployment, and public production domain. Returning users retain their imported identity and admin role. GitHub requests only the existing `user:email` permission. A Google login and GitHub login that belonged to the same source user still resolve to that user.

During staging, `verified` permits existing users to authenticate for read checks; new users and all application mutations stay blocked until `live`. This lets OAuth be verified before the target accepts writes. Both deployments are now live.

## Hosted environments and cutover evidence

- [Development preview](https://rough-consensus-lfb8q1xjz-alexlwn123-s-team.vercel.app): development Convex, existing Vercel deployment protection. A real authenticated admin created a disposable debate, joined through an invitation, cast a pre vote, advanced phases, cast a different post vote, and inspected final results. Fixture cleanup restored exact historical parity.
- [Production](https://consensus.lwn.lol): deployment `dpl_QkQKTgb283JVpewdzE4MySdm1zTS`, built against `befitting-albatross-28` and promoted at approximately `2026-09-15T00:19Z`. Public JavaScript contains the production Convex URL and no old Supabase URL.
- Vercel project `prj_xoXGpqBsYXKHA56FDp9ZAOGJDitj`, team `alexlwn123-s-team`. `VITE_CONVEX_URL` is configured separately for production, preview, and development. The exact staged production origin is also allowed for OAuth. Legacy Supabase environment settings remain only for recovery.
- Before the final snapshot, [freeze-supabase.sql](../scripts/freeze-supabase.sql) drained source writes and installed rejection triggers on the four application tables plus `auth.users` and `auth.identities`. No active debate was present. An empty UPDATE probe failed with SQLSTATE `55000`, confirming the lock even for stale clients.
- Production `migration:enableWrites` succeeded only after final hash verification and frontend promotion. A real production invitation join succeeded; the historical Exploits URL renders its unchanged 33 pre votes, 31 post votes, and chart.
- Full native Convex snapshots before and after cutover are saved privately as `.migration/production-before-cutover.zip` and `.migration/production-after-cutover.zip`. Both ZIPs passed integrity checks. The post-cutover export contains the `live` migration state and final snapshot hash. Native ZIP restore has not been rehearsed; reconstruction into both environments has.

## Reproduction

Use Node 22 or newer and pnpm. Development schema/function deployment:

```sh
pnpm exec convex dev --once
pnpm test:run
pnpm lint
pnpm build
```

Verify the private snapshot against a deployment:

```sh
node scripts/migrate-supabase.mjs .migration/final-source-snapshot.json befitting-albatross-28 --verify-only
```

Exact snapshot comparison is a cutover check; legitimate new production records will cause it to differ later. Never rerun the importer against a live deployment.

For a write-locked target, omit `--verify-only` to import and mark the snapshot verified. An import refuses to run once target writes have opened. It updates matching imported records but does not automatically delete rows absent from a newer snapshot; final reconciliation must explicitly handle source deletions before parity can pass.

Hosted synthetic checks require a development deployment, `ENABLE_MIGRATION_VERIFICATION=true`, and a live migration state:

```sh
node scripts/verify-convex-live.mjs grateful-rabbit-649
```

The script authenticates using the existing Convex CLI credentials, creates temporary data, and removes only its marked fixtures. Reports stay private. Keep fixture creation disabled in production.

## Operations and recovery

The migration and public cutover are complete. Keep fixture creation disabled in production. Before a large event, check shared team quota headroom and expected attendance; the measured load check covered 50 concurrent synthetic voters. No plan upgrade was purchased. Current Convex docs describe manual pausing and usage limits but do not give a perpetual free-availability guarantee. [Convex pausing](https://docs.convex.dev/production/pause-deployment).

Supabase and its original OAuth callbacks remain retained for recovery. Do not unfreeze the source while Convex accepts writes. The old Vercel deployment is `dpl_CEpZWaZmCbtEGQ2NNzYvKGhMAW9L`. The migration source was merged into `main` in [PR #6](https://github.com/alexlwn123/Rough-Consensus/pull/6). Historical schema and policy SQL is retained in the [Supabase archive](migrations/supabase/README.md); obsolete local Supabase configuration, seed data, and CLI cache have been removed.

**Rollback before Convex writes:** restore the old frontend/auth configuration and reopen Supabase writes using [unfreeze-supabase.sql](../scripts/unfreeze-supabase.sql). This simple path no longer applies now that production is live. **Rollback after Convex writes:** freeze target writes first, export and reconcile all new/changed identities and application data before reopening Supabase. Switching the frontend alone would lose accepted changes. A post-write reverse migration has not been rehearsed; prefer a forward fix until that path is proven. Keep the source backup and old configuration for at least 30 days and one successful real event. Decommission only after acceptance.
