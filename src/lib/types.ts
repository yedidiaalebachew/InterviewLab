export const rubricCategories = [
  "relevance",
  "structure",
  "specificity",
  "ownership",
  "impact",
  "reflection",
  "concision",
] as const;

export type RubricCategory = (typeof rubricCategories)[number];

export type Question = {
  slug: string;
  title: string;
  prompt: string;
  category: string;
  guidance: string;
  recommendedSeconds: number;
};

export type TranscriptSegment = {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export type CategoryScore = {
  category: RubricCategory;
  score: number;
  explanation: string;
};

export type FeedbackItem = {
  type: "strength" | "improvement";
  category: RubricCategory;
  title: string;
  explanation: string;
  suggestion: string | null;
  segmentIndexes: number[];
};

export type Evaluation = {
  overallScore: number;
  summary: string;
  categoryScores: CategoryScore[];
  feedback: FeedbackItem[];
  prioritizedRecommendation: string;
  nextAttemptOutline: Array<{ section: string; guidance: string }>;
};

export type Attempt = {
  id: string;
  questionSlug: string;
  attemptNumber: number;
  status: "completed";
  durationSeconds: number;
  transcriptText: string;
  segments: TranscriptSegment[];
  evaluation: Evaluation;
  createdAt: string;
  audioUrl?: string;
};
