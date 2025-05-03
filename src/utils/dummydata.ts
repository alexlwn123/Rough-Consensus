import { DbDebateResult } from "../types";

export const dummyDebateResult = {
  before: {
    pro: 45,
    against: 35,
    undecided: 20,
  },
  after: {
    pro: 60,
    against: 30,
    undecided: 10,
  },
  flows: {
    protopro: 42,
    protoagainst: 2,
    protoundecided: 1,
    againsttopro: 10,
    againsttoagainst: 25,
    againsttoundecided: 0,
    undecidedtopro: 8,
    undecidedtoagainst: 3,
    undecidedtoundecided: 9,
  },
} satisfies DbDebateResult;
