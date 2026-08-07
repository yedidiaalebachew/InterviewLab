import { describe, expect, it } from "vitest";
import { calculateOverallScore } from "@/lib/scoring";
import { rubricCategories, type CategoryScore } from "@/lib/types";

describe("calculateOverallScore", () => {
  it("applies the configured weights and rounds to one decimal", () => {
    const scores: CategoryScore[] = rubricCategories.map((category, index) => ({
      category,
      score: index === 5 ? 3 : 4,
      explanation: "Test",
    }));
    expect(calculateOverallScore(scores)).toBe(3.9);
  });

  it("returns five when every category is five", () => {
    const scores: CategoryScore[] = rubricCategories.map((category) => ({
      category,
      score: 5,
      explanation: "Test",
    }));
    expect(calculateOverallScore(scores)).toBe(5);
  });
});
