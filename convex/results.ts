import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
import { requireDebate } from "./lib/access";
import { aggregateVotes } from "../shared/domain";
export const get = query({
  args: { publicId: v.string() },
  handler: async (ctx, { publicId }) => {
    const debate = await requireDebate(ctx, publicId);
    if (debate.currentPhase !== "finished") return null;
    return aggregateVotes(
      await ctx.db
        .query("votes")
        .withIndex("by_debate_user", (q) => q.eq("debateId", debate._id))
        .collect(),
      debate.currentPhase,
    );
  },
});
export const verifyAll = internalQuery({
  args: {},
  handler: async (ctx) => {
    const debates = await ctx.db.query("debates").collect();
    return Promise.all(
      debates.map(async (d) => ({
        id: d.publicId,
        ...aggregateVotes(
          await ctx.db
            .query("votes")
            .withIndex("by_debate_user", (q) => q.eq("debateId", d._id))
            .collect(),
          d.currentPhase,
        ),
      })),
    );
  },
});
