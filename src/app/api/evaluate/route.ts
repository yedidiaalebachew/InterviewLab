import { NextResponse } from "next/server";
import { z } from "zod";
import { createDemoEvaluation } from "@/lib/demo-evaluation";
import { evaluateWithOpenAI } from "@/lib/ai/evaluate";

const requestSchema = z.object({
  transcriptText: z.string().min(1).max(20000),
  segments: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      startSeconds: z.number().nonnegative(),
      endSeconds: z.number().nonnegative(),
      text: z.string().min(1),
    }),
  ).min(1),
  durationSeconds: z.number().nonnegative().max(180),
  questionSlug: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Transcript payload is invalid." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    const evaluation = createDemoEvaluation(
      parsed.data.transcriptText,
      parsed.data.segments,
      parsed.data.durationSeconds,
    );
    return NextResponse.json({ evaluation, provider: "validated-local-evaluator" });
  }

  try {
    const evaluation = await evaluateWithOpenAI(
      parsed.data.questionSlug,
      parsed.data.segments,
      parsed.data.durationSeconds,
    );
    return NextResponse.json({ evaluation, provider: process.env.EVALUATION_MODEL ?? "gpt-4o-mini" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation provider failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
