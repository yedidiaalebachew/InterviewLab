import { validateModelEvaluation } from "@/lib/evaluation-schema";
import { getQuestion } from "@/lib/questions";
import { rubric } from "@/lib/rubric";
import { calculateOverallScore } from "@/lib/scoring";
import type { Evaluation, TranscriptSegment } from "@/lib/types";

const outputSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "categoryScores",
    "feedback",
    "prioritizedRecommendation",
    "nextAttemptOutline",
  ],
  properties: {
    summary: { type: "string" },
    categoryScores: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "score", "explanation"],
        properties: {
          category: { type: "string", enum: Object.keys(rubric) },
          score: { type: "integer", minimum: 1, maximum: 5 },
          explanation: { type: "string" },
        },
      },
    },
    feedback: {
      type: "array",
      minItems: 4,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "category", "title", "explanation", "suggestion", "segmentIndexes"],
        properties: {
          type: { type: "string", enum: ["strength", "improvement"] },
          category: { type: "string", enum: Object.keys(rubric) },
          title: { type: "string" },
          explanation: { type: "string" },
          suggestion: { type: ["string", "null"] },
          segmentIndexes: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            uniqueItems: true,
            items: { type: "integer", minimum: 0 },
          },
        },
      },
    },
    prioritizedRecommendation: { type: "string" },
    nextAttemptOutline: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["section", "guidance"],
        properties: {
          section: { type: "string" },
          guidance: { type: "string" },
        },
      },
    },
  },
} as const;

export function buildEvaluationPrompt(
  questionSlug: string,
  segments: TranscriptSegment[],
  durationSeconds: number,
) {
  const question = getQuestion(questionSlug);
  if (!question) throw new Error("Unknown interview question.");
  const rubricText = Object.entries(rubric)
    .map(([category, item]) => `${category}: ${item.description}`)
    .join("\n");
  const transcript = segments
    .map((segment) => `[${segment.index}] ${segment.startSeconds.toFixed(1)}-${segment.endSeconds.toFixed(1)} ${segment.text}`)
    .join("\n");
  return `QUESTION:\n${question.prompt}\n\nWHAT A STRONG ANSWER SHOWS:\n${question.guidance}\n\nRUBRIC:\n${rubricText}\n\nANSWER DURATION: ${durationSeconds} seconds\n\nTRANSCRIPT SEGMENTS:\n${transcript}`;
}

export async function evaluateWithOpenAI(
  questionSlug: string,
  segments: TranscriptSegment[],
  durationSeconds: number,
): Promise<Evaluation> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI is not configured.");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.EVALUATION_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "Evaluate behavioral interview answers using only the supplied transcript. Every substantive observation must cite one to three existing segment indexes. Do not invent facts, metrics, intentions, emotions, or context. Do not evaluate accent, personality, confidence, appearance, or protected characteristics. Describe missing details as missing, not as negative facts. Never recommend fabricating a metric. Return exactly two strengths and two or three improvements. Return only schema-conforming JSON.",
        },
        { role: "user", content: buildEvaluationPrompt(questionSlug, segments, durationSeconds) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "behavioral_interview_evaluation",
          strict: true,
          schema: outputSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Evaluation provider failed with status ${response.status}.`);
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string; refusal?: string } }>;
  };
  const message = payload.choices?.[0]?.message;
  if (message?.refusal) throw new Error("The evaluation provider declined this transcript.");
  if (!message?.content) throw new Error("The evaluation provider returned no structured output.");

  let modelOutput: unknown;
  try {
    modelOutput = JSON.parse(message.content);
  } catch {
    throw new Error("The evaluation provider returned malformed JSON.");
  }
  const validated = validateModelEvaluation(modelOutput, segments);
  return { ...validated, overallScore: calculateOverallScore(validated.categoryScores) };
}
