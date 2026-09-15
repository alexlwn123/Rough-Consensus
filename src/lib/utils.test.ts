import { describe, expect, it } from "vitest";
import { calculatePercentage, getPhaseDisplay } from "./utils";
describe("utils", () => {
  it("returns readable labels for each debate phase", () => {
    expect(getPhaseDisplay("scheduled")).toBe("Scheduled");
    expect(getPhaseDisplay("pre")).toBe("Pre-Debate");
    expect(getPhaseDisplay("ongoing")).toBe("Ongoing");
    expect(getPhaseDisplay("post")).toBe("Post-Debate");
    expect(getPhaseDisplay("finished")).toBe("Finished");
    expect(getPhaseDisplay(null)).toBe("Unknown");
  });

  it("calculates rounded percentages and handles zero totals", () => {
    expect(calculatePercentage(1, 3)).toBe(33);
    expect(calculatePercentage(2, 3)).toBe(67);
    expect(calculatePercentage(0, 0)).toBe(0);
  });
});
