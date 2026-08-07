import { validateModelEvaluation } from "@/lib/evaluation-schema";
import { calculateOverallScore } from "@/lib/scoring";
import type { Evaluation, RubricCategory, TranscriptSegment } from "@/lib/types";

const sentence = (segments: TranscriptSegment[], index: number) =>
  segments[Math.min(index, segments.length - 1)]?.index ?? 0;

export function createDemoEvaluation(
  transcriptText: string,
  segments: TranscriptSegment[],
  durationSeconds: number,
): Evaluation {
  const text = transcriptText.toLowerCase();
  const words = transcriptText.trim().split(/\s+/).filter(Boolean);
  const personal = (text.match(/\b(i|my|me)\b/g) ?? []).length;
  const team = (text.match(/\b(we|our|team)\b/g) ?? []).length;
  const hasMetric = /\b\d+([.%x]|\s*(percent|users|hours|days|weeks|seconds))?\b/.test(text);
  const hasReflection = /\b(learned|realized|next time|since then|taught me|now i)\b/.test(text);
  const hasStructure = /\b(situation|task|first|then|after|result|ultimately|finally)\b/.test(text);
  const hasSpecifics = words.length >= 70 && /\b(because|implemented|designed|investigated|created|decided)\b/.test(text);

  const values: Record<RubricCategory, number> = {
    relevance: words.length < 20 ? 2 : 4,
    structure: hasStructure ? 4 : words.length > 50 ? 3 : 2,
    specificity: hasSpecifics ? 4 : words.length > 45 ? 3 : 2,
    ownership: personal > team ? 4 : personal > 1 ? 3 : 2,
    impact: hasMetric ? 5 : /\b(result|improved|reduced|increased|launched|successful)\b/.test(text) ? 3 : 2,
    reflection: hasReflection ? 4 : 2,
    concision: durationSeconds <= 150 && words.length <= 330 ? 4 : 3,
  };

  const explanations: Record<RubricCategory, string> = {
    relevance: "The response stays connected to the selected behavioral question.",
    structure: hasStructure
      ? "The answer uses transitions that make the sequence of events easy to follow."
      : "The events are understandable, but the situation, actions, and result need clearer separation.",
    specificity: hasSpecifics
      ? "The answer identifies concrete actions rather than relying only on general claims."
      : "The response needs more concrete technical or situational detail.",
    ownership:
      personal > team
        ? "The response clearly identifies personal decisions and actions."
        : "Team-level language appears more often than a clear description of individual ownership.",
    impact: hasMetric
      ? "The outcome includes quantified evidence."
      : "The outcome is not supported by a concrete measure or observable result.",
    reflection: hasReflection
      ? "The answer connects the experience to a specific lesson."
      : "The answer does not yet explain what changed in the candidate's later behavior.",
    concision:
      durationSeconds <= 150 ? "The response fits comfortably within the recommended interview length." : "The response could be tightened.",
  };

  const categoryScores = (Object.keys(values) as RubricCategory[]).map((category) => ({
    category,
    score: values[category],
    explanation: explanations[category],
  }));
  const strongest = [...categoryScores].sort((a, b) => b.score - a.score)[0];
  const weakest = [...categoryScores].sort((a, b) => a.score - b.score)[0];

  const raw = {
    summary:
      "This answer establishes a useful foundation. The next attempt should preserve its strongest element while making personal actions, results, and reflection easier for an interviewer to identify.",
    categoryScores,
    feedback: [
      {
        type: "strength" as const,
        category: strongest.category,
        title: `Strong ${strongest.category}`,
        explanation: strongest.explanation,
        suggestion: null,
        segmentIndexes: [sentence(segments, 0)],
      },
      {
        type: "strength" as const,
        category: "relevance" as const,
        title: "Focused response",
        explanation: "The answer remains focused on one example instead of moving across unrelated stories.",
        suggestion: null,
        segmentIndexes: [sentence(segments, 0)],
      },
      {
        type: "improvement" as const,
        category: weakest.category,
        title: `Clarify ${weakest.category}`,
        explanation: weakest.explanation,
        suggestion: "Add one precise sentence that supplies the missing evidence, without inventing details or metrics.",
        segmentIndexes: [sentence(segments, Math.max(0, segments.length - 1))],
      },
      {
        type: "improvement" as const,
        category: "ownership" as const,
        title: "Separate your work from the team's",
        explanation: "Name the decision, analysis, artifact, or implementation that you personally owned.",
        suggestion: "Use a sentence beginning with “I” and a concrete action verb.",
        segmentIndexes: [sentence(segments, Math.floor(segments.length / 2))],
      },
    ],
    prioritizedRecommendation:
      "On the next attempt, explicitly state what you personally did and connect it to one accurate, observable outcome.",
    nextAttemptOutline: [
      { section: "Situation", guidance: "Set the context and stakes in two concise sentences." },
      { section: "Task", guidance: "State the responsibility or problem you personally needed to address." },
      { section: "Action", guidance: "Describe two or three concrete decisions and actions you owned." },
      { section: "Result", guidance: "Give the outcome and an accurate measure if one is available." },
      { section: "Reflection", guidance: "Explain what you learned or would repeat differently." },
    ],
  };

  const validated = validateModelEvaluation(raw, segments);
  return { ...validated, overallScore: calculateOverallScore(validated.categoryScores) };
}
