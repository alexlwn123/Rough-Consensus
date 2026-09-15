import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { option, phase } from "./schema";

const nullableString = v.union(v.string(), v.null());
const ballot = v.union(v.object({ option }), v.null());
const userRow = v.object({
  id: v.string(),
  email: nullableString,
  created_at: v.string(),
  is_anonymous: v.boolean(),
  full_name: nullableString,
  name: nullableString,
});
const identityRow = v.object({
  id: v.string(),
  user_id: v.string(),
  provider: v.string(),
  provider_id: v.string(),
  subject: nullableString,
});
const debateRow = v.object({
  id: v.string(),
  title: v.string(),
  description: nullableString,
  motion: nullableString,
  pro_description: nullableString,
  con_description: nullableString,
  current_phase: phase,
  created_by: nullableString,
  created_at: v.string(),
  start_time: v.string(),
  end_time: nullableString,
  is_deleted: v.boolean(),
});
const voteRow = v.object({
  id: v.string(),
  debate_id: v.string(),
  user_id: v.string(),
  pre_vote: ballot,
  post_vote: ballot,
  created_at: v.string(),
});
const accessRow = v.object({
  id: v.string(),
  debate_id: v.string(),
  user_id: v.string(),
  created_at: v.string(),
});
const roleRow = v.object({
  id: v.string(),
  user_id: v.string(),
  role: v.string(),
  created_at: v.string(),
});

async function importedUser(ctx: MutationCtx, legacyId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
  if (!user) throw new Error("Missing imported user reference");
  return user._id;
}
async function importedDebate(ctx: MutationCtx, publicId: string) {
  const debate = await ctx.db
    .query("debates")
    .withIndex("by_public_id", (q) => q.eq("publicId", publicId))
    .unique();
  if (!debate) throw new Error("Missing imported debate reference");
  return debate._id;
}

// Internal-only. The migration lock prevents a rerun from overwriting accepted live votes.
export const begin = internalMutation({
  args: { sourceProject: v.string(), snapshotHash: v.string() },
  handler: async (ctx, args) => {
    const state = await ctx.db.query("migrationState").unique();
    if (state?.status === "live")
      throw new Error(
        "Live imports require a separate reconciliation migration",
      );
    if (state && state.sourceProject !== args.sourceProject)
      throw new Error("Unexpected source project");
    const values = {
      ...args,
      importedAt: new Date().toISOString(),
      status: "importing" as const,
    };
    if (state) await ctx.db.replace(state._id, values);
    else await ctx.db.insert("migrationState", values);
  },
});

export const load = internalMutation({
  args: {
    snapshotHash: v.string(),
    batch: v.union(
      v.object({ table: v.literal("users"), rows: v.array(userRow) }),
      v.object({ table: v.literal("identities"), rows: v.array(identityRow) }),
      v.object({ table: v.literal("debates"), rows: v.array(debateRow) }),
      v.object({ table: v.literal("votes"), rows: v.array(voteRow) }),
      v.object({ table: v.literal("debate_access"), rows: v.array(accessRow) }),
      v.object({ table: v.literal("user_roles"), rows: v.array(roleRow) }),
    ),
  },
  handler: async (ctx, { snapshotHash, batch }) => {
    const state = await ctx.db.query("migrationState").unique();
    if (state?.status !== "importing" || state.snapshotHash !== snapshotHash)
      throw new Error("Import is not open for this snapshot");
    switch (batch.table) {
      case "users":
        for (const row of batch.rows) {
          const old = await ctx.db
            .query("users")
            .withIndex("by_legacy_id", (q) => q.eq("legacyId", row.id))
            .unique();
          const data = {
            legacyId: row.id,
            legacyCreatedAt: row.created_at,
            legacyFullName: row.full_name,
            legacyName: row.name,
            name: row.full_name ?? row.name ?? undefined,
            email: row.email ?? undefined,
            isAnonymous: row.is_anonymous,
          };
          if (old) await ctx.db.patch(old._id, data);
          else await ctx.db.insert("users", data);
        }
        break;
      case "identities":
        for (const row of batch.rows) {
          if (!["github", "google"].includes(row.provider))
            throw new Error("Unsupported historical auth provider");
          const userId = await importedUser(ctx, row.user_id);
          const old = await ctx.db
            .query("authAccounts")
            .withIndex("providerAndAccountId", (q) =>
              q
                .eq("provider", row.provider)
                .eq("providerAccountId", row.provider_id),
            )
            .unique();
          if (old && old.userId !== userId)
            throw new Error("Conflicting provider identity ownership");
          const data = {
            userId,
            provider: row.provider,
            providerAccountId: row.provider_id,
            legacyId: row.id,
            legacySubject: row.subject,
          };
          if (old) await ctx.db.patch(old._id, data);
          else await ctx.db.insert("authAccounts", data);
        }
        break;
      case "debates":
        for (const row of batch.rows) {
          const old = await ctx.db
            .query("debates")
            .withIndex("by_public_id", (q) => q.eq("publicId", row.id))
            .unique();
          const data = {
            publicId: row.id,
            title: row.title,
            description: row.description,
            motion: row.motion,
            proDescription: row.pro_description,
            conDescription: row.con_description,
            currentPhase: row.current_phase,
            phaseVersion: 0,
            createdBy: row.created_by
              ? await importedUser(ctx, row.created_by)
              : null,
            createdAt: row.created_at,
            startTime: row.start_time,
            endTime: row.end_time,
            isDeleted: row.is_deleted,
          };
          if (old) await ctx.db.replace(old._id, data);
          else await ctx.db.insert("debates", data);
        }
        break;
      case "votes":
        for (const row of batch.rows) {
          const debateId = await importedDebate(ctx, row.debate_id),
            userId = await importedUser(ctx, row.user_id);
          const old = await ctx.db
            .query("votes")
            .withIndex("by_debate_user", (q) =>
              q.eq("debateId", debateId).eq("userId", userId),
            )
            .unique();
          const data = {
            legacyId: row.id,
            debateId,
            userId,
            preVote: row.pre_vote?.option ?? null,
            postVote: row.post_vote?.option ?? null,
            createdAt: row.created_at,
            version: 0,
          };
          if (old) await ctx.db.replace(old._id, data);
          else await ctx.db.insert("votes", data);
        }
        break;
      case "debate_access":
        for (const row of batch.rows) {
          const debateId = await importedDebate(ctx, row.debate_id),
            userId = await importedUser(ctx, row.user_id);
          const old = await ctx.db
            .query("debateAccess")
            .withIndex("by_debate_user", (q) =>
              q.eq("debateId", debateId).eq("userId", userId),
            )
            .unique();
          const data = {
            legacyId: row.id,
            debateId,
            userId,
            createdAt: row.created_at,
          };
          if (old) await ctx.db.replace(old._id, data);
          else await ctx.db.insert("debateAccess", data);
        }
        break;
      case "user_roles":
        for (const row of batch.rows) {
          const userId = await importedUser(ctx, row.user_id);
          const old = await ctx.db
            .query("userRoles")
            .withIndex("by_user_role", (q) =>
              q.eq("userId", userId).eq("role", row.role),
            )
            .unique();
          const data = {
            legacyId: row.id,
            userId,
            role: row.role,
            createdAt: row.created_at,
          };
          if (old) await ctx.db.replace(old._id, data);
          else await ctx.db.insert("userRoles", data);
        }
    }
    return batch.rows.length;
  },
});

export const snapshot = internalQuery({
  args: {},
  handler: async (ctx) => ({
    users: await ctx.db.query("users").collect(),
    identities: await ctx.db.query("authAccounts").collect(),
    debates: await ctx.db.query("debates").collect(),
    votes: await ctx.db.query("votes").collect(),
    debate_access: await ctx.db.query("debateAccess").collect(),
    user_roles: await ctx.db.query("userRoles").collect(),
    state: await ctx.db.query("migrationState").unique(),
  }),
});

export const markVerified = internalMutation({
  args: { snapshotHash: v.string() },
  handler: async (ctx, { snapshotHash }) => {
    const state = await ctx.db.query("migrationState").unique();
    if (state?.status !== "importing" || state.snapshotHash !== snapshotHash)
      throw new Error("Wrong snapshot or state");
    await ctx.db.patch(state._id, { status: "verified" });
  },
});

export const enableWrites = internalMutation({
  args: { snapshotHash: v.string() },
  handler: async (ctx, { snapshotHash }) => {
    const state = await ctx.db.query("migrationState").unique();
    if (state?.status !== "verified" || state.snapshotHash !== snapshotHash)
      throw new Error("Only the verified snapshot can be opened for writes");
    await ctx.db.patch(state._id, { status: "live" });
  },
});
