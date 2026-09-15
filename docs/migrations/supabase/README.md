# Historical Supabase migrations

These SQL files preserve the schema, policies, and functions from the Supabase backend that preceded the Convex migration. They are archived unchanged for reconciliation and recovery reference. New backend changes belong in `convex/`.

This archive is not an active Supabase project, a complete database backup, or a runnable rollback procedure. The old local configuration, seed file, and CLI cache were removed after the migration.

See the [migration status and recovery runbook](../../convex-migration-status.md) for the final snapshot, verification evidence, retained private backups, and recovery constraints. The export, import, and source freeze/unfreeze utilities remain in [scripts](../../../scripts). Production uses Convex; the original Supabase project remains read-only during the recovery window.
