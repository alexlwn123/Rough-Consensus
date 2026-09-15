import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import { aggregateVotes } from "../shared/domain";
import type { VoteOption } from "../shared/domain";
const modules = import.meta.glob("./**/!(*.*.*)*.*s");
const publicId = "11111111-1111-4111-8111-111111111111";
async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    await ctx.db.insert("migrationState", {
      sourceProject: "test",
      snapshotHash: "abc",
      importedAt: "2026-01-01",
      status: "live",
    });
    const admin = await ctx.db.insert("users", { name: "Admin" });
    const member = await ctx.db.insert("users", { name: "Voter" });
    const stranger = await ctx.db.insert("users", { name: "Stranger" });
    await ctx.db.insert("userRoles", {
      userId: admin,
      role: "admin",
      createdAt: "2026-01-01",
    });
    return { admin, member, stranger };
  });
  const admin = t.withIdentity({ subject: ids.admin });
  const member = t.withIdentity({ subject: ids.member });
  const stranger = t.withIdentity({ subject: ids.stranger });
  await admin.mutation(api.debates.create, {
    publicId,
    title: "Test debate",
    description: "",
  });
  await member.mutation(api.debates.join, { publicId });
  await admin.mutation(api.debates.setPhase, {
    publicId,
    phase: "pre",
    expectedVersion: 0,
  });
  return { t, admin, member, stranger, ids };
}
const initialVote = {
  publicId,
  phase: "pre" as const,
  phaseVersion: 1,
  expectedVoteVersion: 0,
  option: "for" as const,
};

describe("debate access and voting", () => {
  it("protects active debates, ballots, admin actions, and hidden results from direct calls", async () => {
    const { t, stranger, member } = await setup();
    expect(await t.query(api.debates.get, { publicId })).toBeNull();
    expect(await stranger.query(api.debates.listVisible)).toEqual([]);
    await expect(
      stranger.mutation(api.votes.cast, initialVote),
    ).rejects.toThrow("access unavailable");
    await expect(t.mutation(api.votes.cast, initialVote)).rejects.toThrow(
      "sign in",
    );
    await expect(
      member.mutation(api.debates.setPhase, {
        publicId,
        phase: "ongoing",
        expectedVersion: 1,
      }),
    ).rejects.toThrow("Administrator");
    await expect(
      member.mutation(api.debates.create, {
        publicId: "22222222-2222-4222-8222-222222222222",
        title: "No",
        description: "",
      }),
    ).rejects.toThrow("Administrator");
    await member.mutation(api.votes.cast, initialVote);
    expect(await member.query(api.results.get, { publicId })).toBeNull();
    expect(await t.query(api.votes.mine, { publicId })).toBeNull();
    await expect(
      stranger.query(api.votes.mine, { publicId }),
    ).rejects.toThrow();
  });
  it("records one ballot on repeated submissions, rejects stale edits, and preserves pre voting during post", async () => {
    const { t, member, admin } = await setup();
    await Promise.all([
      member.mutation(api.votes.cast, initialVote),
      member.mutation(api.votes.cast, initialVote),
    ]);
    expect(await t.run((ctx) => ctx.db.query("votes").collect())).toHaveLength(
      1,
    );
    await expect(
      member.mutation(api.votes.cast, { ...initialVote, option: "against" }),
    ).rejects.toThrow("another window");
    await member.mutation(api.votes.cast, {
      ...initialVote,
      option: "against",
      expectedVoteVersion: 1,
    });
    await admin.mutation(api.debates.setPhase, {
      publicId,
      phase: "ongoing",
      expectedVersion: 1,
    });
    await expect(
      member.mutation(api.votes.cast, {
        ...initialVote,
        expectedVoteVersion: 2,
      }),
    ).rejects.toThrow("closed or changed");
    await admin.mutation(api.debates.setPhase, {
      publicId,
      phase: "post",
      expectedVersion: 2,
    });
    await member.mutation(api.votes.cast, {
      ...initialVote,
      phase: "post",
      phaseVersion: 3,
      expectedVoteVersion: 2,
    });
    expect(await member.query(api.votes.mine, { publicId })).toMatchObject({
      pre_vote: { option: "against" },
      post_vote: { option: "for" },
      version: 3,
    });
  });
  it("requires a pre vote, publishes only aggregates after finish, and hides them on reopening", async () => {
    const { t, member, stranger, admin } = await setup();
    await stranger.mutation(api.debates.join, { publicId });
    await member.mutation(api.votes.cast, initialVote);
    await admin.mutation(api.debates.setPhase, {
      publicId,
      phase: "ongoing",
      expectedVersion: 1,
    });
    await admin.mutation(api.debates.setPhase, {
      publicId,
      phase: "post",
      expectedVersion: 2,
    });
    await expect(
      stranger.mutation(api.votes.cast, {
        ...initialVote,
        phase: "post",
        phaseVersion: 3,
      }),
    ).rejects.toThrow("pre-debate vote");
    await member.mutation(api.votes.cast, {
      ...initialVote,
      phase: "post",
      phaseVersion: 3,
      expectedVoteVersion: 1,
      option: "against",
    });
    await admin.mutation(api.debates.setPhase, {
      publicId,
      phase: "finished",
      expectedVersion: 3,
    });
    const results = await t.query(api.results.get, { publicId });
    expect(results?.result.flows.protoagainst).toBe(1);
    expect(Object.keys(results!)).toEqual(["counts", "result"]);
    expect(await t.query(api.debates.listVisible)).toHaveLength(1);
    await admin.mutation(api.debates.setPhase, {
      publicId,
      phase: "post",
      expectedVersion: 4,
    });
    expect(await member.query(api.results.get, { publicId })).toBeNull();
    await expect(t.query(api.results.get, { publicId })).rejects.toThrow();
  });
  it("rejects stale phase controls and old submissions after a close/reopen cycle", async () => {
    const { admin, member } = await setup();
    await expect(
      admin.mutation(api.debates.setPhase, {
        publicId,
        phase: "finished",
        expectedVersion: 1,
      }),
    ).rejects.toThrow("one phase");
    await admin.mutation(api.debates.setPhase, {
      publicId,
      phase: "ongoing",
      expectedVersion: 1,
    });
    await expect(
      admin.mutation(api.debates.setPhase, {
        publicId,
        phase: "pre",
        expectedVersion: 1,
      }),
    ).rejects.toThrow("another window");
    await admin.mutation(api.debates.setPhase, {
      publicId,
      phase: "pre",
      expectedVersion: 2,
    });
    await expect(member.mutation(api.votes.cast, initialVote)).rejects.toThrow(
      "closed or changed",
    );
  });
  it("joins idempotently and rejects deleted/missing debates", async () => {
    const { t, member } = await setup();
    await member.mutation(api.debates.join, { publicId });
    expect(
      await t.run((ctx) => ctx.db.query("debateAccess").collect()),
    ).toHaveLength(1);
    await expect(
      member.mutation(api.debates.join, { publicId: "missing" }),
    ).rejects.toThrow("unavailable");
    await t.run(async (ctx) => {
      const d = await ctx.db.query("debates").unique();
      await ctx.db.patch(d!._id, { isDeleted: true });
    });
    expect(await member.query(api.debates.get, { publicId })).toBeNull();
    await expect(
      member.mutation(api.debates.join, { publicId }),
    ).rejects.toThrow("unavailable");
    await expect(member.mutation(api.votes.cast, initialVote)).rejects.toThrow(
      "unavailable",
    );
  });
  it("blocks writes during migration without affecting existing reads", async () => {
    const { t, member } = await setup();
    await t.run(async (ctx) => {
      const state = await ctx.db.query("migrationState").unique();
      await ctx.db.patch(state!._id, { status: "importing" });
    });
    await expect(member.mutation(api.votes.cast, initialVote)).rejects.toThrow(
      "Migration verification",
    );
    expect(await member.query(api.debates.get, { publicId })).not.toBeNull();
  });
  it("does not expose another voter’s ballot to a member", async () => {
    const { member, stranger } = await setup();
    await member.mutation(api.votes.cast, initialVote);
    await stranger.mutation(api.debates.join, { publicId });
    expect(await stranger.query(api.votes.mine, { publicId })).toBeNull();
  });
  it("prevents an importer rerun after live writes have started", async () => {
    const { t } = await setup();
    await expect(
      t.mutation(internal.migration.begin, {
        sourceProject: "test",
        snapshotHash: "abc",
      }),
    ).rejects.toThrow("Live imports");
  });
});
describe("result aggregation", () => {
  it("includes all nine flows, counts pre-only ballots, and handles empty debates", () => {
    const options: VoteOption[] = ["for", "against", "undecided"];
    const ballots = options.flatMap((preVote) =>
      options.map((postVote) => ({ preVote, postVote })),
    );
    const result = aggregateVotes(
      [...ballots, { preVote: "for", postVote: null }],
      "finished",
    );
    expect(Object.values(result.result.flows)).toEqual(Array(9).fill(1));
    expect(result.counts).toEqual({
      pre: { for: 4, against: 3, undecided: 3 },
      post: { for: 3, against: 3, undecided: 3 },
      total_voters: 10,
      current_phase: "finished",
    });
    expect(aggregateVotes([], "finished").counts.total_voters).toBe(0);
  });
});
