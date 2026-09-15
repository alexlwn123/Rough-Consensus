import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run(async (ctx) => {
    await ctx.db.insert("migrationState", {
      sourceProject: "test",
      snapshotHash: "test",
      importedAt: "2026-09-14",
      status: "live",
    });
    const id = await ctx.db.insert("users", {
      legacyId: "original-user",
      email: "admin@example.com",
      emailVerificationTime: 1,
    });
    await ctx.db.insert("userRoles", {
      userId: id,
      role: "admin",
      createdAt: "2026-09-14",
    });
    for (const provider of ["github", "google"]) {
      await ctx.db.insert("authAccounts", {
        userId: id,
        provider,
        providerAccountId: `${provider}-original`,
      });
    }
    return id;
  });
  async function oauth(
    provider: string,
    providerAccountId: string,
    email: string,
  ) {
    const signature = crypto.randomUUID();
    await t.run((ctx) => ctx.db.insert("authVerifiers", { signature }));
    // Exercise the auth library's post-provider-verification mutation. The real
    // provider redirect/token exchange remains a separate browser acceptance check.
    await t.mutation(internal.auth.store, {
      args: {
        type: "userOAuth",
        provider,
        providerAccountId,
        signature,
        profile: { email, emailVerified: true, name: "Provider name" },
      },
    });
    return t.run((ctx) =>
      ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", provider).eq("providerAccountId", providerAccountId),
        )
        .unique(),
    );
  }
  return { t, userId, oauth };
}

describe("imported OAuth identity continuity", () => {
  it("resolves both linked providers to the original admin even when email changes", async () => {
    const { t, userId, oauth } = await setup();
    expect(
      (await oauth("github", "github-original", "changed@example.com"))?.userId,
    ).toBe(userId);
    expect(
      (await oauth("google", "google-original", "other@example.com"))?.userId,
    ).toBe(userId);
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(
      1,
    );
    expect(
      await t.run((ctx) => ctx.db.query("userRoles").unique()),
    ).toMatchObject({ userId, role: "admin" });
  });

  it("keeps an unknown provider account separate even with the same verified email", async () => {
    const { t, userId, oauth } = await setup();
    const first = await oauth("github", "new-account", "admin@example.com");
    expect(first?.userId).not.toBe(userId);
    expect(
      (await oauth("github", "new-account", "changed@example.com"))?.userId,
    ).toBe(first?.userId);
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(
      2,
    );
    expect(
      await t.run((ctx) =>
        ctx.db
          .query("userRoles")
          .withIndex("by_user_role", (q) => q.eq("userId", first!.userId))
          .collect(),
      ),
    ).toEqual([]);
  });

  it("allows returning users but blocks new accounts while the verified target is read-only", async () => {
    const { t, oauth } = await setup();
    await t.run(async (ctx) => {
      const state = await ctx.db.query("migrationState").unique();
      await ctx.db.patch(state!._id, { status: "verified" });
    });
    expect(
      (await oauth("github", "github-original", "admin@example.com"))?.userId,
    ).toBeDefined();
    await expect(
      oauth("github", "new-account", "new@example.com"),
    ).rejects.toThrow("Migration verification");
  });
});
