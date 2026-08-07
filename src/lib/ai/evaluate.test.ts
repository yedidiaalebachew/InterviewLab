import { describe, expect, it } from "vitest";
import { buildEvaluationPrompt } from "@/lib/ai/evaluate";

describe("buildEvaluationPrompt", () => {
  it("includes stable indexes, the question, duration, and rubric", () => {
    const prompt = buildEvaluationPrompt(
      "difficult-technical-problem",
      [{ index: 3, startSeconds: 8, endSeconds: 14, text: "I traced the failure to validation." }],
      72,
    );
    expect(prompt).toContain("Tell me about a difficult technical problem");
    expect(prompt).toContain("[3] 8.0-14.0");
    expect(prompt).toContain("ANSWER DURATION: 72 seconds");
    expect(prompt).toContain("ownership:");
  });

  it("rejects unknown questions", () => {
    expect(() => buildEvaluationPrompt("unknown", [], 20)).toThrow(/Unknown interview question/);
  });
});
