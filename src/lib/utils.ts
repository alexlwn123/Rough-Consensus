import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Phase } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPhaseDisplay(phase: Phase | null): string {
  switch (phase) {
    case "scheduled":
      return "Scheduled";
    case "pre":
      return "Pre-Debate";
    case "ongoing":
      return "Ongoing";
    case "post":
      return "Post-Debate";
    case "finished":
      return "Finished";
    default:
      return "Unknown";
  }
}

export const calculatePercentage = (count: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
};
