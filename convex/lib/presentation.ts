import type { Doc } from "../_generated/dataModel";
import type { Debate, Vote } from "../../shared/domain";
export function presentDebate(d: Doc<"debates">): Debate {
  return {
    id: d.publicId,
    title: d.title,
    description: d.description,
    motion: d.motion,
    proDescription: d.proDescription,
    conDescription: d.conDescription,
    currentPhase: d.currentPhase,
    phaseVersion: d.phaseVersion,
    createdBy: d.createdBy,
    createdAt: d.createdAt,
    startTime: d.startTime,
    endTime: d.endTime,
    isDeleted: d.isDeleted,
  };
}
export function presentVote(v: Doc<"votes">, publicId: string): Vote {
  return {
    id: v._id,
    debate_id: publicId,
    user_id: v.userId,
    created_at: v.createdAt,
    version: v.version,
    pre_vote: v.preVote === null ? null : { option: v.preVote },
    post_vote: v.postVote === null ? null : { option: v.postVote },
  };
}
