import { z } from "zod";
import { rubricCategories, type TranscriptSegment } from "@/lib/types";

const categorySchema = z.enum(rubricCategories);

const categoryScoreSchema = z.object({
  category: categorySchema,
  score: z.number().int().min(1).max(5),
  explanation: z.string().min(1).max(500),
});

const feedbackItemSchema = z.object({
  type: z.enum(["strength", "improvement"]),
  category: categorySchema,
  title: z.string().min(1).max(100),
  explanation: z.string().min(1).max(500),
  suggestion: z.string().max(500).nullable(),
  segmentIndexes: z.array(z.number().int().nonnegative()).min(1).max(3),
});

export const modelEvaluationSchema = z.object({
  summary: z.string().min(1).max(750),
  categoryScores: z.array(categoryScoreSchema).length(7),
  feedback: z.array(feedbackItemSchema).min(4).max(5),
  prioritizedRecommendation: z.string().min(1).max(500),
  nextAttemptOutline: z
    .array(z.object({ section: z.string().min(1), guidance: z.string().min(1) }))
    .min(3)
    .max(5),
});

export function validateModelEvaluation(input: unknown, segments: TranscriptSegment[]) {
  const parsed = modelEvaluationSchema.parse(input);
  const categories = parsed.categoryScores.map((score) => score.category);
  if (new Set(categories).size !== rubricCategories.length) {
    throw new Error("Evaluation must contain exactly one score for every rubric category.");
  }
  for (const category of rubricCategories) {
    if (!categories.includes(category)) {
      throw new Error(`Evaluation is missing the ${category} category.`);
    }
  }
  const validIndexes = new Set(segments.map((segment) => segment.index));
  for (const item of parsed.feedback) {
    if (new Set(item.segmentIndexes).size !== item.segmentIndexes.length) {
      throw new Error("Feedback contains duplicate evidence references.");
    }
    if (item.segmentIndexes.some((index) => !validIndexes.has(index))) {
      throw new Error("Feedback references a transcript segment that does not exist.");
    }
  }
  return parsed;
}
