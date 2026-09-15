import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

const sourcePath = process.argv[2];
const deployment = process.argv[3];
if (!sourcePath || !deployment)
  throw new Error(
    "Usage: node scripts/migrate-supabase.mjs <private-snapshot.json> <deployment-name> [--verify-only]",
  );
const sourceBytes = readFileSync(sourcePath);
const source = JSON.parse(sourceBytes);
const snapshotHash = createHash("sha256").update(sourceBytes).digest("hex");
const tables = [
  "users",
  "identities",
  "debates",
  "votes",
  "debate_access",
  "user_roles",
];
const reportDirectory = ".migration";
mkdirSync(reportDirectory, { recursive: true, mode: 0o700 });

function run(name, args = {}) {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "convex",
      "run",
      name,
      JSON.stringify(args),
      "--deployment",
      deployment,
    ],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    // CLI validator errors may contain private rows; keep diagnostics out of logs.
    writeFileSync(
      `${reportDirectory}/last-error.txt`,
      result.stderr + result.stdout,
      { mode: 0o600 },
    );
    throw new Error(
      `${name} failed; private diagnostics in .migration/last-error.txt`,
    );
  }
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}
function unique(rows, key) {
  assert.equal(
    new Set(rows.map(key)).size,
    rows.length,
    "Duplicate source key",
  );
}
for (const table of tables) unique(source[table], (r) => r.id);
unique(source.identities, (r) => `${r.provider}:${r.provider_id}`);
unique(source.votes, (r) => `${r.debate_id}:${r.user_id}`);
unique(source.debate_access, (r) => `${r.debate_id}:${r.user_id}`);
unique(source.user_roles, (r) => `${r.user_id}:${r.role}`);
const sourceUsers = new Set(source.users.map((u) => u.id));
const sourceDebates = new Set(source.debates.map((d) => d.id));
for (const table of ["identities", "votes", "debate_access", "user_roles"]) {
  for (const row of source[table])
    assert(sourceUsers.has(row.user_id), `Orphan user in ${table}`);
}
for (const table of ["votes", "debate_access"]) {
  for (const row of source[table])
    assert(sourceDebates.has(row.debate_id), `Orphan debate in ${table}`);
}
for (const d of source.debates)
  assert(
    d.created_by === null || sourceUsers.has(d.created_by),
    "Orphan creator",
  );
for (const identity of source.identities) {
  assert(
    ["github", "google"].includes(identity.provider),
    "Unimplemented auth provider",
  );
  assert(
    identity.subject === null || identity.subject === identity.provider_id,
    "Provider subject needs reconciliation",
  );
}
for (const row of source.votes) {
  for (const field of ["pre_vote", "post_vote"]) {
    if (row[field] !== null) {
      assert.deepEqual(
        Object.keys(row[field]),
        ["option"],
        "Unexpected ballot shape",
      );
      assert(
        ["for", "against", "undecided"].includes(row[field].option),
        "Invalid option",
      );
    }
  }
}

if (!process.argv.includes("--verify-only")) {
  run("migration:begin", { sourceProject: source.sourceProject, snapshotHash });
  for (const table of tables) {
    for (let start = 0; start < source[table].length; start += 50) {
      run("migration:load", {
        snapshotHash,
        batch: { table, rows: source[table].slice(start, start + 50) },
      });
    }
    console.log(`Imported ${table}: ${source[table].length}`);
  }
}
const target = run("migration:snapshot");
writeFileSync(
  `${reportDirectory}/${deployment}-snapshot.json`,
  JSON.stringify(target, null, 2),
  { mode: 0o600 },
);
const userIds = new Map(target.users.map((u) => [u._id, u.legacyId]));
const debateIds = new Map(target.debates.map((d) => [d._id, d.publicId]));
const restored = {
  users: target.users.map((u) => ({
    id: u.legacyId,
    email: u.email ?? null,
    created_at: u.legacyCreatedAt,
    is_anonymous: u.isAnonymous,
    full_name: u.legacyFullName,
    name: u.legacyName,
  })),
  identities: target.identities.map((i) => ({
    id: i.legacyId,
    user_id: userIds.get(i.userId),
    provider: i.provider,
    provider_id: i.providerAccountId,
    subject: i.legacySubject,
  })),
  debates: target.debates.map((d) => ({
    id: d.publicId,
    title: d.title,
    description: d.description,
    motion: d.motion,
    pro_description: d.proDescription,
    con_description: d.conDescription,
    current_phase: d.currentPhase,
    created_by: d.createdBy === null ? null : userIds.get(d.createdBy),
    created_at: d.createdAt,
    start_time: d.startTime,
    end_time: d.endTime,
    is_deleted: d.isDeleted,
  })),
  votes: target.votes.map((v) => ({
    id: v.legacyId,
    debate_id: debateIds.get(v.debateId),
    user_id: userIds.get(v.userId),
    pre_vote: v.preVote === null ? null : { option: v.preVote },
    post_vote: v.postVote === null ? null : { option: v.postVote },
    created_at: v.createdAt,
  })),
  debate_access: target.debate_access.map((a) => ({
    id: a.legacyId,
    debate_id: debateIds.get(a.debateId),
    user_id: userIds.get(a.userId),
    created_at: a.createdAt,
  })),
  user_roles: target.user_roles.map((r) => ({
    id: r.legacyId,
    user_id: userIds.get(r.userId),
    role: r.role,
    created_at: r.createdAt,
  })),
};
const byId = (rows) => rows.toSorted((a, b) => a.id.localeCompare(b.id));
for (const table of tables) {
  // Report only the table name on failure; assertions can otherwise print user data.
  try {
    assert.deepEqual(byId(restored[table]), byId(source[table]));
  } catch {
    throw new Error(
      `Field-by-field reconciliation failed for ${table}; inspect private snapshots`,
    );
  }
}
for (const expected of source.results) {
  const votes = restored.votes.filter((v) => v.debate_id === expected.id);
  const counts = {
    pre: { for: 0, against: 0, undecided: 0 },
    post: { for: 0, against: 0, undecided: 0 },
    total_voters: new Set(votes.map((v) => v.user_id)).size,
    current_phase: source.debates.find((d) => d.id === expected.id)
      .current_phase,
  };
  const flows = Object.fromEntries(
    ["pro", "against", "undecided"].flatMap((a) =>
      ["pro", "against", "undecided"].map((b) => [`${a}to${b}`, 0]),
    ),
  );
  for (const vote of votes) {
    if (vote.pre_vote) counts.pre[vote.pre_vote.option]++;
    if (vote.post_vote) counts.post[vote.post_vote.option]++;
    if (vote.pre_vote && vote.post_vote)
      flows[
        `${vote.pre_vote.option === "for" ? "pro" : vote.pre_vote.option}to${vote.post_vote.option === "for" ? "pro" : vote.post_vote.option}`
      ]++;
  }
  const chart = (c) => ({
    pro: c.for,
    against: c.against,
    undecided: c.undecided,
  });
  assert.deepEqual(
    counts,
    expected.counts,
    `Count mismatch for debate ${expected.id}`,
  );
  assert.deepEqual(
    { before: chart(counts.pre), after: chart(counts.post), flows },
    expected.result,
    `Flow mismatch for debate ${expected.id}`,
  );
}
if (!process.argv.includes("--verify-only"))
  run("migration:markVerified", { snapshotHash });
const report = {
  sourceProject: source.sourceProject,
  sourceExportedAt: source.exportedAt,
  snapshotHash,
  deployment,
  verifiedAt: new Date().toISOString(),
  counts: Object.fromEntries(tables.map((t) => [t, source[t].length])),
  debatesWithMatchingResults: source.results.length,
  exactFieldParity: true,
  credentialsImported: false,
};
writeFileSync(
  `${reportDirectory}/${deployment}-verification.json`,
  JSON.stringify(report, null, 2),
  { mode: 0o600 },
);
console.log(JSON.stringify(report, null, 2));
