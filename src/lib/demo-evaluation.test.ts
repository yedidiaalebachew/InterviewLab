import { describe, expect, it } from "vitest";
import { createDemoEvaluation } from "@/lib/demo-evaluation";

const segments = [
  { index: 0, startSeconds: 0, endSeconds: 8, text: "Our team found a problem." },
  { index: 1, startSeconds: 8, endSeconds: 16, text: "I investigated the API and implemented validation." },
  { index: 2, startSeconds: 16, endSeconds: 24, text: "Errors dropped by 30 percent and I learned to test boundaries." },
];

describe("createDemoEvaluation", () => {
  it("produces all categories and valid overall score", () => {
    const evaluation = createDemoEvaluation(segments.map((item) => item.text).join(" "), segments, 80);
    expect(evaluation.categoryScores).toHaveLength(7);
    expect(evaluation.feedback).toHaveLength(4);
    expect(evaluation.overallScore).toBeGreaterThanOrEqual(1);
    expect(evaluation.overallScore).toBeLessThanOrEqual(5);
  });

  it("rewards accurate quantified impact evidence", () => {
    const evaluation = createDemoEvaluation(segments.map((item) => item.text).join(" "), segments, 80);
    expect(evaluation.categoryScores.find((score) => score.category === "impact")?.score).toBe(5);
  });
});
