import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Debate, DebateDb } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function coerceDebateListFromDb(debates: DebateDb[]): Debate[] {
  return debates.map(coerceDebateFromDb);
}

export function coerceDebateFromDb(debate: DebateDb): Debate {
  return {
    id: debate.id,
    title: debate.title,
    description: debate.description,
    currentPhase: debate.current_phase,
    startTime: debate.start_time,
    endTime: debate.end_time,
    createdBy: debate.created_by,
    createdAt: debate.created_at,
    motion: debate.motion,
    proDescription: debate.pro_description,
    conDescription: debate.con_description,
    isDeleted: debate.is_deleted,
  };
}
