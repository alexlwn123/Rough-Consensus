import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const option = v.union(
  v.literal("for"),
  v.literal("against"),
  v.literal("undecided"),
);
export const phase = v.union(
  v.literal("scheduled"),
  v.literal("pre"),
  v.literal("ongoing"),
  v.literal("post"),
  v.literal("finished"),
);
const nullableString = v.union(v.string(), v.null());

export default defineSchema({
  ...authTables,
  users: defineTable({
    ...authTables.users.validator.fields,
    legacyId: v.optional(v.string()),
    legacyCreatedAt: v.optional(v.string()),
    legacyFullName: v.optional(nullableString),
    legacyName: v.optional(nullableString),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_legacy_id", ["legacyId"]),
  authAccounts: defineTable({
    ...authTables.authAccounts.validator.fields,
    legacyId: v.optional(v.string()),
    legacySubject: v.optional(nullableString),
  })
    .index("userIdAndProvider", ["userId", "provider"])
    .index("providerAndAccountId", ["provider", "providerAccountId"]),
  debates: defineTable({
    publicId: v.string(),
    title: v.string(),
    description: nullableString,
    motion: nullableString,
    proDescription: nullableString,
    conDescription: nullableString,
    currentPhase: phase,
    phaseVersion: v.number(),
    createdBy: v.union(v.id("users"), v.null()),
    createdAt: v.string(),
    startTime: v.string(),
    endTime: nullableString,
    isDeleted: v.boolean(),
  })
    .index("by_public_id", ["publicId"])
    .index("by_phase_start", ["currentPhase", "startTime"]),
  votes: defineTable({
    legacyId: v.optional(v.string()),
    debateId: v.id("debates"),
    userId: v.id("users"),
    preVote: v.union(option, v.null()),
    postVote: v.union(option, v.null()),
    createdAt: v.string(),
    version: v.number(),
  }).index("by_debate_user", ["debateId", "userId"]),
  debateAccess: defineTable({
    legacyId: v.optional(v.string()),
    debateId: v.id("debates"),
    userId: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_debate_user", ["debateId", "userId"])
    .index("by_user", ["userId"]),
  userRoles: defineTable({
    legacyId: v.optional(v.string()),
    userId: v.id("users"),
    role: v.string(),
    createdAt: v.string(),
  }).index("by_user_role", ["userId", "role"]),
  migrationState: defineTable({
    sourceProject: v.string(),
    snapshotHash: v.string(),
    importedAt: v.string(),
    status: v.union(
      v.literal("importing"),
      v.literal("verified"),
      v.literal("live"),
    ),
  }).index("by_source", ["sourceProject"]),
});
