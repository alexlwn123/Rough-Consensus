import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
function requireVerification() {
  if (process.env.ENABLE_MIGRATION_VERIFICATION !== "true")
    throw new Error("Verification fixtures are disabled on this deployment");
}
export const createFixture = internalMutation({
  args: { publicId: v.string(), voters: v.number() },
  handler: async (ctx, { publicId, voters }) => {
    requireVerification();
    if (!Number.isInteger(voters) || voters < 1 || voters > 100)
      throw new Error("Use 1–100 synthetic voters");
    const admin = await ctx.db.insert("users", {
      name: `Migration QA ${publicId}`,
    });
    await ctx.db.insert("userRoles", {
      userId: admin,
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    const users = [];
    for (let i = 0; i < voters; i++)
      users.push(
        await ctx.db.insert("users", { name: `Migration QA ${publicId}` }),
      );
    return { admin, users };
  },
});
export const removeFixture = internalMutation({
  args: { publicId: v.string() },
  handler: async (ctx, { publicId }) => {
    requireVerification();
    const debate = await ctx.db
      .query("debates")
      .withIndex("by_public_id", (q) => q.eq("publicId", publicId))
      .unique();
    if (debate) {
      if (
        debate.title !== `Migration QA ${publicId}` &&
        debate.title !== "Migration QA OAuth verification"
      )
        throw new Error("Not a verification debate");
      for (const v of await ctx.db
        .query("votes")
        .withIndex("by_debate_user", (q) => q.eq("debateId", debate._id))
        .collect())
        await ctx.db.delete(v._id);
      for (const a of await ctx.db
        .query("debateAccess")
        .withIndex("by_debate_user", (q) => q.eq("debateId", debate._id))
        .collect())
        await ctx.db.delete(a._id);
      await ctx.db.delete(debate._id);
    }
    for (const user of await ctx.db.query("users").collect()) {
      if (user.name !== `Migration QA ${publicId}` || user.legacyId) continue;
      for (const role of await ctx.db
        .query("userRoles")
        .withIndex("by_user_role", (q) => q.eq("userId", user._id))
        .collect())
        await ctx.db.delete(role._id);
      await ctx.db.delete(user._id);
    }
  },
});
