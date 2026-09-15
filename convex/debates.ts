import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  canRead,
  findDebate,
  requireAdmin,
  requireUser,
  requireWrites,
} from "./lib/access";
import { presentDebate } from "./lib/presentation";
import { phase } from "./schema";

export const listVisible = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const all = await ctx.db.query("debates").collect();
    const permitted = await Promise.all(
      all.map(async (d) =>
        (await canRead(ctx, d, userId)) ? presentDebate(d) : null,
      ),
    );
    return permitted
      .filter((d) => d !== null)
      .sort((a, b) => b.startTime.localeCompare(a.startTime));
  },
});
export const get = query({
  args: { publicId: v.string() },
  handler: async (ctx, { publicId }) => {
    const debate = await findDebate(ctx, publicId);
    return debate && (await canRead(ctx, debate, await getAuthUserId(ctx)))
      ? presentDebate(debate)
      : null;
  },
});
export const join = mutation({
  args: { publicId: v.string() },
  handler: async (ctx, { publicId }) => {
    await requireWrites(ctx);
    const userId = await requireUser(ctx),
      debate = await findDebate(ctx, publicId);
    if (!debate || debate.isDeleted)
      throw new ConvexError("This debate invitation is unavailable.");
    const existing = await ctx.db
      .query("debateAccess")
      .withIndex("by_debate_user", (q) =>
        q.eq("debateId", debate._id).eq("userId", userId),
      )
      .unique();
    if (!existing)
      await ctx.db.insert("debateAccess", {
        debateId: debate._id,
        userId,
        createdAt: new Date().toISOString(),
      });
    return publicId;
  },
});
export const create = mutation({
  args: { publicId: v.string(), title: v.string(), description: v.string() },
  handler: async (ctx, args) => {
    await requireWrites(ctx);
    const userId = await requireAdmin(ctx);
    const title = args.title.trim();
    if (!title || title.length > 300 || args.description.length > 10000)
      throw new ConvexError(
        "Enter a title of up to 300 characters and description of up to 10,000 characters.",
      );
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        args.publicId,
      )
    )
      throw new ConvexError("Invalid debate ID.");
    const existing = await findDebate(ctx, args.publicId);
    if (existing) {
      if (
        existing.createdBy !== userId ||
        existing.title !== title ||
        existing.description !== args.description
      )
        throw new ConvexError("Debate ID already exists.");
      return presentDebate(existing);
    }
    const now = new Date().toISOString();
    const id = await ctx.db.insert("debates", {
      publicId: args.publicId,
      title,
      description: args.description,
      motion: null,
      proDescription: null,
      conDescription: null,
      currentPhase: "scheduled",
      phaseVersion: 0,
      createdBy: userId,
      createdAt: now,
      startTime: now,
      endTime: null,
      isDeleted: false,
    });
    return presentDebate((await ctx.db.get(id))!);
  },
});
export const setPhase = mutation({
  args: { publicId: v.string(), phase, expectedVersion: v.number() },
  handler: async (ctx, args) => {
    await requireWrites(ctx);
    await requireAdmin(ctx);
    const debate = await findDebate(ctx, args.publicId);
    if (!debate || debate.isDeleted) throw new ConvexError("Debate not found.");
    if (debate.phaseVersion !== args.expectedVersion)
      throw new ConvexError(
        "The phase changed in another window. Refresh and try again.",
      );
    if (args.phase === debate.currentPhase) return;
    const phases = ["scheduled", "pre", "ongoing", "post", "finished"];
    if (
      Math.abs(
        phases.indexOf(debate.currentPhase) - phases.indexOf(args.phase),
      ) !== 1
    )
      throw new ConvexError("Move forward or backward one phase at a time.");
    await ctx.db.patch(debate._id, {
      currentPhase: args.phase,
      phaseVersion: debate.phaseVersion + 1,
    });
  },
});
