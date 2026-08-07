import { describe, expect, it } from "vitest";
import { validateModelEvaluation } from "@/lib/evaluation-schema";
import { rubricCategories } from "@/lib/types";

const segments = [{ index: 0, startSeconds: 0, endSeconds: 5, text: "I investigated the issue." }];
const valid = {
  summary: "A grounded summary.",
  categoryScores: rubricCategories.map((category) => ({ category, score: 3, explanation: "Grounded explanation." })),
  feedback: [
    { type: "strength", category: "relevance", title: "Focused", explanation: "Focused.", suggestion: null, segmentIndexes: [0] },
    { type: "strength", category: "structure", title: "Clear", explanation: "Clear.", suggestion: null, segmentIndexes: [0] },
    { type: "improvement", category: "impact", title: "Add impact", explanation: "No outcome.", suggestion: "Add a real result.", segmentIndexes: [0] },
    { type: "improvement", category: "reflection", title: "Reflect", explanation: "No lesson.", suggestion: "Add a lesson.", segmentIndexes: [0] },
  ],
  prioritizedRecommendation: "Add the result.",
  nextAttemptOutline: [
    { section: "Situation", guidance: "Set context." },
    { section: "Action", guidance: "Explain actions." },
    { section: "Result", guidance: "State outcome." },
  ],
};

describe("validateModelEvaluation", () => {
  it("accepts complete grounded output", () => {
    expect(validateModelEvaluation(valid, segments).categoryScores).toHaveLength(7);
  });

  it("rejects an invalid evidence reference", () => {
    const invalid = structuredClone(valid);
    invalid.feedback[0].segmentIndexes = [99];
    expect(() => validateModelEvaluation(invalid, segments)).toThrow(/does not exist/);
  });

  it("rejects duplicate categories", () => {
    const invalid = structuredClone(valid);
    invalid.categoryScores[6].category = "relevance";
    expect(() => validateModelEvaluation(invalid, segments)).toThrow(/exactly one score/);
  });

  it("rejects duplicate evidence indexes", () => {
    const invalid = structuredClone(valid);
    invalid.feedback[0].segmentIndexes = [0, 0];
    expect(() => validateModelEvaluation(invalid, segments)).toThrow(/duplicate evidence/);
  });
});
