import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { ConvexHttpClient, ConvexClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
const deployment = process.argv[2];
if (!deployment) throw new Error("Pass a development deployment name");
// Reuse the same scoped authorization flow as the installed Convex CLI.
const { accessToken } = JSON.parse(
  readFileSync(`${homedir()}/.convex/config.json`, "utf8"),
);
const response = await fetch(
  "https://api.convex.dev/api/deployment/authorize_within_current_project",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selectedDeploymentName: deployment,
      projectSelection: {
        kind: "teamAndProjectSlugs",
        teamSlug: "alex-lewin",
        projectSlug: "rough-consensus",
      },
    }),
  },
);
if (!response.ok)
  throw new Error(`Deployment authorization failed: ${response.status}`);
const { url, adminKey, deploymentType } = await response.json();
assert.equal(
  deploymentType,
  "dev",
  "Synthetic verification runs only on development deployments",
);
const ref = (name) => makeFunctionReference(name);
const control = new ConvexHttpClient(url, { logger: false });
control.setAdminAuth(adminKey);
const clientFor = (id) => {
  const c = new ConvexHttpClient(url, { logger: false });
  c.setAdminAuth(adminKey, {
    subject: id,
    issuer: "migration-verification",
    tokenIdentifier: `migration-verification|${id}`,
  });
  return c;
};
const publicClient = new ConvexHttpClient(url, { logger: false });
const snapshot = JSON.parse(
  readFileSync(".migration/source-snapshot.json", "utf8"),
);
const before = await control.query(ref("results:verifyAll"), {});
assert.deepEqual(
  before.toSorted((a, b) => a.id.localeCompare(b.id)),
  snapshot.results.toSorted((a, b) => a.id.localeCompare(b.id)),
);
const publicId = randomUUID();
let fixture;
const sockets = [];
const report = {
  deployment,
  startedAt: new Date().toISOString(),
  historicalResultsMatched: 11,
  syntheticVoters: 50,
  authMethod: "Convex admin test identities; external OAuth is not exercised",
};
try {
  fixture = await control.mutation(ref("verification:createFixture"), {
    publicId,
    voters: 50,
  });
  const admin = clientFor(fixture.admin),
    voters = fixture.users.map(clientFor);
  await admin.mutation(ref("debates:create"), {
    publicId,
    title: `Migration QA ${publicId}`,
    description: "Disposable migration verification",
  });
  await Promise.all(
    voters.map((c) => c.mutation(ref("debates:join"), { publicId })),
  );
  assert.equal(
    await publicClient.query(ref("debates:get"), { publicId }),
    null,
  );
  await assert.rejects(
    publicClient.mutation(ref("votes:cast"), {
      publicId,
      phase: "pre",
      phaseVersion: 1,
      expectedVoteVersion: 0,
      option: "for",
    }),
  );
  // Two real WebSocket clients must observe the admin's phase change.
  let seen = 0;
  const observed = new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Phase subscription timeout")),
      10000,
    );
    for (const id of fixture.users.slice(0, 2)) {
      const c = new ConvexClient(url, { logger: false });
      sockets.push(c);
      c.setAdminAuth(adminKey, {
        subject: id,
        issuer: "migration-verification",
        tokenIdentifier: `migration-verification|${id}`,
      });
      let delivered = false;
      c.onUpdate(ref("debates:get"), { publicId }, (value) => {
        if (value?.currentPhase === "pre" && !delivered) {
          delivered = true;
          if (++seen === 2) {
            clearTimeout(timeout);
            resolve();
          }
        }
      });
    }
  });
  const phaseStart = performance.now();
  await admin.mutation(ref("debates:setPhase"), {
    publicId,
    phase: "pre",
    expectedVersion: 0,
  });
  await observed;
  report.twoSubscriberPhaseMs = Math.round(performance.now() - phaseStart);
  const args = {
    publicId,
    phase: "pre",
    phaseVersion: 1,
    expectedVoteVersion: 0,
    option: "for",
  };
  // Independent requests race to insert the same ballot: must remain one per user.
  const [durations] = await Promise.all([
    Promise.all(
      voters.map(async (c) => {
        const start = performance.now();
        await c.mutation(ref("votes:cast"), args);
        return performance.now() - start;
      }),
    ),
    Promise.all(
      Array.from({ length: 10 }, () =>
        voters[0].mutation(ref("votes:cast"), args),
      ),
    ),
  ]);
  const ballot = await voters[0].query(ref("votes:mine"), { publicId });
  assert.equal(ballot.version, 1);
  await assert.rejects(
    voters[0].mutation(ref("votes:cast"), { ...args, option: "against" }),
  );
  const closing = admin.mutation(ref("debates:setPhase"), {
    publicId,
    phase: "ongoing",
    expectedVersion: 1,
  });
  const racing = voters[0].mutation(ref("votes:cast"), {
    ...args,
    expectedVoteVersion: 1,
    option: "against",
  });
  const [closeResult] = await Promise.allSettled([closing, racing]);
  assert.equal(
    closeResult.status,
    "fulfilled",
    "Admin phase close must succeed",
  );
  await assert.rejects(
    voters[1].mutation(ref("votes:cast"), {
      ...args,
      expectedVoteVersion: 1,
      option: "against",
    }),
  );
  await admin.mutation(ref("debates:setPhase"), {
    publicId,
    phase: "post",
    expectedVersion: 2,
  });
  await Promise.all(
    voters.map(async (c) => {
      const v = await c.query(ref("votes:mine"), { publicId });
      await c.mutation(ref("votes:cast"), {
        publicId,
        phase: "post",
        phaseVersion: 3,
        expectedVoteVersion: v.version,
        option: "against",
      });
    }),
  );
  await admin.mutation(ref("debates:setPhase"), {
    publicId,
    phase: "finished",
    expectedVersion: 3,
  });
  const results = await publicClient.query(ref("results:get"), { publicId });
  assert.equal(results.counts.total_voters, 50);
  assert.equal(results.counts.post.against, 50);
  assert.equal(
    Object.values(results.result.flows).reduce((a, b) => a + b, 0),
    50,
  );
  assert.deepEqual(Object.keys(results).sort(), ["counts", "result"]);
  report.voteP95Ms = Math.round(
    durations.toSorted((a, b) => a - b)[Math.ceil(durations.length * 0.95) - 1],
  );
  report.completed = true;
} finally {
  for (const socket of sockets) await socket.close();
  await control.mutation(ref("verification:removeFixture"), { publicId });
}
const after = await control.query(ref("results:verifyAll"), {});
assert.deepEqual(
  after.toSorted((a, b) => a.id.localeCompare(b.id)),
  before.toSorted((a, b) => a.id.localeCompare(b.id)),
);
report.historicalResultsUnchanged = true;
report.completedAt = new Date().toISOString();
writeFileSync(
  ".migration/live-verification.json",
  JSON.stringify(report, null, 2),
  { mode: 0o600 },
);
console.log(JSON.stringify(report, null, 2));
