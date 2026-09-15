import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { isAdmin } from "./lib/access";
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    return user
      ? {
          id: user._id,
          displayName: user.name || user.email || "Anonymous",
          isAdmin: await isAdmin(ctx, user._id),
        }
      : null;
  },
});
