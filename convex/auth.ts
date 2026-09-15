import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";
import { requireWrites } from "./lib/access";
import { authRedirect } from "./lib/authRedirect";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({ authorization: { params: { scope: "user:email" } } }),
    Google,
  ],
  callbacks: {
    async redirect({ redirectTo }) {
      if (!process.env.SITE_URL) throw new Error("SITE_URL is required");
      return authRedirect(
        redirectTo,
        process.env.SITE_URL,
        process.env.AUTH_ALLOWED_ORIGINS,
      );
    },
    // Imported authAccounts bind provider IDs to the original user. Do not
    // automatically link an unrelated login to an imported account by email.
    async createOrUpdateUser(ctx, args) {
      // Returning users can verify login against a reconciled, read-only target.
      // New accounts and application writes stay closed until cutover.
      if (args.existingUserId) {
        const state = await ctx.db.query("migrationState").unique();
        if (state?.status === "verified") return args.existingUserId;
      }
      await requireWrites(ctx as MutationCtx);
      if (args.existingUserId) return args.existingUserId;
      return ctx.db.insert("users", {
        name:
          typeof args.profile.name === "string" ? args.profile.name : undefined,
        email: args.profile.email,
        image:
          typeof args.profile.image === "string"
            ? args.profile.image
            : undefined,
      });
    },
  },
});
