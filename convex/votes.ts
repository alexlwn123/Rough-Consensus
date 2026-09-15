import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { requireDebate, requireUser, requireWrites } from "./lib/access";
import { presentVote } from "./lib/presentation";
import { option } from "./schema";
export const mine = query({
  args: { publicId: v.string() },
  handler: async (ctx, { publicId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const debate = await requireDebate(ctx, publicId);
    const vote = await ctx.db
      .query("votes")
      .withIndex("by_debate_user", (q) =>
        q.eq("debateId", debate._id).eq("userId", userId),
      )
      .unique();
    return vote ? presentVote(vote, publicId) : null;
  },
});
export const cast = mutation({
  args: {
    publicId: v.string(),
    phase: v.union(v.literal("pre"), v.literal("post")),
    phaseVersion: v.number(),
    expectedVoteVersion: v.number(),
    option,
  },
  handler: async (ctx, args) => {
    await requireWrites(ctx);
    const userId = await requireUser(ctx),
      debate = await requireDebate(ctx, args.publicId);
    if (
      debate.currentPhase !== args.phase ||
      debate.phaseVersion !== args.phaseVersion
    )
      throw new ConvexError("This voting phase has closed or changed.");
    const vote = await ctx.db
      .query("votes")
      .withIndex("by_debate_user", (q) =>
        q.eq("debateId", debate._id).eq("userId", userId),
      )
      .unique();
    if (args.phase === "post" && !vote?.preVote)
      throw new ConvexError(
        "A pre-debate vote is required to vote after the debate.",
      );
    const field = args.phase === "pre" ? "preVote" : "postVote";
    // Repeated delivery of the same choice is harmless, even from an older tab.
    if (vote?.[field] === args.option) return presentVote(vote, args.publicId);
    if ((vote?.version ?? 0) !== args.expectedVoteVersion)
      throw new ConvexError(
        "Your vote changed in another window. Check your selection and try again.",
      );
    if (vote) {
      await ctx.db.patch(vote._id, {
        [field]: args.option,
        version: vote.version + 1,
      });
      return presentVote((await ctx.db.get(vote._id))!, args.publicId);
    }
    const id = await ctx.db.insert("votes", {
      debateId: debate._id,
      userId,
      preVote: args.option,
      postVote: null,
      createdAt: new Date().toISOString(),
      version: 1,
    });
    return presentVote((await ctx.db.get(id))!, args.publicId);
  },
});
