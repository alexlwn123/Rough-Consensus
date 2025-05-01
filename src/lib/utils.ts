import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DebateSession } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function coerceDebateListFromDb(debates: any[]): DebateSession[] {
  return debates.map(coerceDebateFromDb);
}

export function coerceDebateFromDb(debate: any): DebateSession {
  return {
    id: debate.id,
    title: debate.title,
    description: debate.description,
    currentPhase: debate.current_phase,
    startTime: debate.start_time,
    endTime: debate.end_time,
    createdBy: debate.created_by,
    motion: debate.motion,
    proDescription: debate.pro_description,
    conDescription: debate.con_description,
    isDeleted: debate.is_deleted,
  };
}
