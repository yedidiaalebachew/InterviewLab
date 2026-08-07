import type { RubricCategory } from "@/lib/types";

export const rubric: Record<
  RubricCategory,
  { label: string; description: string; weight: number }
> = {
  relevance: { label: "Relevance", description: "Directly answers the question.", weight: 0.15 },
  structure: { label: "Structure", description: "Uses a clear, coherent narrative.", weight: 0.15 },
  specificity: { label: "Specificity", description: "Provides concrete context and actions.", weight: 0.15 },
  ownership: { label: "Ownership", description: "Clarifies individual contributions.", weight: 0.15 },
  impact: { label: "Impact", description: "Explains meaningful results.", weight: 0.15 },
  reflection: { label: "Reflection", description: "Shows learning and changed behavior.", weight: 0.1 },
  concision: { label: "Concision", description: "Uses time efficiently.", weight: 0.15 },
};
