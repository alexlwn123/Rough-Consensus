export type VoteOption = "for" | "against" | "undecided";
export type OAuthProvider = "github" | "google";
export type Phase = "scheduled" | "pre" | "ongoing" | "post" | "finished";
export interface User {
  id: string;
  displayName: string;
  isAdmin: boolean;
}
export interface Debate {
  id: string;
  title: string;
  description: string | null;
  motion: string | null;
  proDescription: string | null;
  conDescription: string | null;
  currentPhase: Phase;
  phaseVersion: number;
  createdBy: string | null;
  createdAt: string;
  startTime: string;
  endTime: string | null;
  isDeleted: boolean;
}
export interface Vote {
  id: string;
  debate_id: string;
  user_id: string;
  created_at: string;
  version: number;
  pre_vote: { option: VoteOption } | null;
  post_vote: { option: VoteOption } | null;
}
export type PhaseCounts = Record<VoteOption, number>;
export interface Tally {
  pre: PhaseCounts;
  post: PhaseCounts;
  total_voters: number;
  current_phase: Phase | null;
}
type ChartOption = "pro" | "against" | "undecided";
export interface DbDebateResult {
  before: Record<ChartOption, number>;
  after: Record<ChartOption, number>;
  flows: Record<`${ChartOption}to${ChartOption}`, number>;
}
export function emptyTally(currentPhase: Phase | null = null): Tally {
  return {
    pre: { for: 0, against: 0, undecided: 0 },
    post: { for: 0, against: 0, undecided: 0 },
    total_voters: 0,
    current_phase: currentPhase,
  };
}
export function aggregateVotes(
  votes: ReadonlyArray<{
    preVote: VoteOption | null;
    postVote: VoteOption | null;
  }>,
  currentPhase: Phase,
) {
  const counts = emptyTally(currentPhase);
  const result: DbDebateResult = {
    before: { pro: 0, against: 0, undecided: 0 },
    after: { pro: 0, against: 0, undecided: 0 },
    flows: {
      protopro: 0,
      protoagainst: 0,
      protoundecided: 0,
      againsttopro: 0,
      againsttoagainst: 0,
      againsttoundecided: 0,
      undecidedtopro: 0,
      undecidedtoagainst: 0,
      undecidedtoundecided: 0,
    },
  };
  const chartOption = (choice: VoteOption): ChartOption =>
    choice === "for" ? "pro" : choice;
  for (const vote of votes) {
    counts.total_voters++;
    if (vote.preVote) {
      counts.pre[vote.preVote]++;
      result.before[chartOption(vote.preVote)]++;
    }
    if (vote.postVote) {
      counts.post[vote.postVote]++;
      result.after[chartOption(vote.postVote)]++;
    }
    if (vote.preVote && vote.postVote)
      result.flows[
        `${chartOption(vote.preVote)}to${chartOption(vote.postVote)}`
      ]++;
  }
  return { counts, result };
}
