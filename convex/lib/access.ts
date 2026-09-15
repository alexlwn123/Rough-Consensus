import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export async function requireUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId || !(await ctx.db.get(userId)))
    throw new ConvexError("Please sign in to continue.");
  return userId;
}
export async function isAdmin(ctx: QueryCtx, userId: Id<"users"> | null) {
  if (!userId) return false;
  return !!(await ctx.db
    .query("userRoles")
    .withIndex("by_user_role", (q) =>
      q.eq("userId", userId).eq("role", "admin"),
    )
    .unique());
}
export async function requireAdmin(ctx: QueryCtx) {
  const userId = await requireUser(ctx);
  if (!(await isAdmin(ctx, userId)))
    throw new ConvexError("Administrator access is required.");
  return userId;
}
export async function findDebate(ctx: QueryCtx, publicId: string) {
  return ctx.db
    .query("debates")
    .withIndex("by_public_id", (q) => q.eq("publicId", publicId))
    .unique();
}
export async function canRead(
  ctx: QueryCtx,
  debate: Doc<"debates">,
  userId: Id<"users"> | null,
) {
  if (debate.isDeleted) return false;
  if (debate.currentPhase === "finished") return true;
  if (!userId) return false;
  return (
    (await isAdmin(ctx, userId)) ||
    !!(await ctx.db
      .query("debateAccess")
      .withIndex("by_debate_user", (q) =>
        q.eq("debateId", debate._id).eq("userId", userId),
      )
      .unique())
  );
}
export async function requireDebate(ctx: QueryCtx, publicId: string) {
  const debate = await findDebate(ctx, publicId);
  if (!debate || !(await canRead(ctx, debate, await getAuthUserId(ctx))))
    throw new ConvexError("Debate not found or access unavailable.");
  return debate;
}
export async function requireWrites(ctx: QueryCtx) {
  const state = await ctx.db.query("migrationState").unique();
  if (state?.status !== "live")
    throw new ConvexError(
      "Migration verification is in progress. Please try again later.",
    );
}
