import { rubric } from "@/lib/rubric";
import { rubricCategories, type CategoryScore } from "@/lib/types";

export function calculateOverallScore(scores: CategoryScore[]) {
  const byCategory = new Map(scores.map((score) => [score.category, score.score]));
  const total = rubricCategories.reduce(
    (sum, category) => sum + (byCategory.get(category) ?? 0) * rubric[category].weight,
    0,
  );
  return Math.round(total * 10) / 10;
}
