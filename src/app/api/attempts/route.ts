import { NextResponse } from "next/server";
import { z } from "zod";
import { modelEvaluationSchema } from "@/lib/evaluation-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { audioExtension, validateAudioFile } from "@/lib/audio-validation";
import type { Attempt, RubricCategory } from "@/lib/types";

const segmentSchema = z.object({
  index: z.number().int().nonnegative(),
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().nonnegative(),
  text: z.string().min(1),
});

const payloadSchema = z.object({
  attemptId: z.string().uuid(),
  questionSlug: z.string().min(1).max(100),
  durationSeconds: z.number().nonnegative().max(180),
  transcriptText: z.string().min(1).max(20000),
  segments: z.array(segmentSchema).min(1),
  evaluation: modelEvaluationSchema.extend({
    overallScore: z.number().min(1).max(5),
  }),
  modelName: z.string().min(1).max(100),
});

type RemoteAttemptRow = {
  id: string;
  attempt_number: number;
  duration_seconds: number;
  transcript_text: string;
  created_at: string;
  audio_path: string | null;
  questions: { slug: string } | Array<{ slug: string }>;
  transcript_segments: Array<{
    segment_index: number;
    start_seconds: number;
    end_seconds: number;
    text: string;
  }>;
  evaluations:
    | {
        overall_score: number;
        summary: string;
        prioritized_recommendation: string;
        next_attempt_outline: Array<{ section: string; guidance: string }>;
        category_scores: Array<{ category: RubricCategory; score: number; explanation: string }>;
        feedback_items: Array<{
          type: "strength" | "improvement";
          category: RubricCategory;
          title: string;
          explanation: string;
          suggestion: string | null;
          segment_indexes: number[];
        }>;
      }
    | Array<{
        overall_score: number;
        summary: string;
        prioritized_recommendation: string;
        next_attempt_outline: Array<{ section: string; guidance: string }>;
        category_scores: Array<{ category: RubricCategory; score: number; explanation: string }>;
        feedback_items: Array<{
          type: "strength" | "improvement";
          category: RubricCategory;
          title: string;
          explanation: string;
          suggestion: string | null;
          segment_indexes: number[];
        }>;
      }>;
};

function first<T>(value: T | T[]) {
  return Array.isArray(value) ? value[0] : value;
}

function toAttempt(row: RemoteAttemptRow, audioUrl?: string): Attempt {
  const question = first(row.questions);
  const evaluation = first(row.evaluations);
  return {
    id: row.id,
    questionSlug: question.slug,
    attemptNumber: row.attempt_number,
    status: "completed",
    durationSeconds: Number(row.duration_seconds),
    transcriptText: row.transcript_text,
    segments: row.transcript_segments
      .map((segment) => ({
        index: segment.segment_index,
        startSeconds: Number(segment.start_seconds),
        endSeconds: Number(segment.end_seconds),
        text: segment.text,
      }))
      .sort((a, b) => a.index - b.index),
    evaluation: {
      overallScore: Number(evaluation.overall_score),
      summary: evaluation.summary,
      prioritizedRecommendation: evaluation.prioritized_recommendation,
      nextAttemptOutline: evaluation.next_attempt_outline,
      categoryScores: evaluation.category_scores.map((score) => ({
        category: score.category,
        score: score.score,
        explanation: score.explanation,
      })),
      feedback: evaluation.feedback_items.map((item) => ({
        type: item.type,
        category: item.category,
        title: item.title,
        explanation: item.explanation,
        suggestion: item.suggestion,
        segmentIndexes: item.segment_indexes,
      })),
    },
    createdAt: row.created_at,
    audioUrl,
  };
}

export async function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Production persistence is not configured." }, { status: 503 });
  }
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  let query = supabase
    .from("attempts")
    .select(`
      id, attempt_number, duration_seconds, transcript_text, created_at, audio_path,
      questions!inner(slug),
      transcript_segments(segment_index, start_seconds, end_seconds, text),
      evaluations!inner(
        overall_score, summary, prioritized_recommendation, next_attempt_outline,
        category_scores(category, score, explanation),
        feedback_items(type, category, title, explanation, suggestion, segment_indexes)
      )
    `)
    .eq("status", "completed")
    .order("created_at", { ascending: false });
  if (id) query = query.eq("id", id).limit(1);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Attempt history could not be loaded." }, { status: 502 });
  }

  const rows = (data ?? []) as unknown as RemoteAttemptRow[];
  const attempts = await Promise.all(
    rows.map(async (row) => {
      let audioUrl: string | undefined;
      if (id && row.audio_path) {
        const { data: signed } = await supabase.storage
          .from("interview-audio")
          .createSignedUrl(row.audio_path, 3600);
        audioUrl = signed?.signedUrl;
      }
      return toAttempt(row, audioUrl);
    }),
  );
  return NextResponse.json({ attempts });
}

export async function DELETE(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Production persistence is not configured." }, { status: 503 });
  }
  const id = new URL(request.url).searchParams.get("id");
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "A valid attempt ID is required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  const { data: attempt, error: lookupError } = await supabase
    .from("attempts")
    .select("audio_path")
    .eq("id", parsedId.data)
    .single();
  if (lookupError || !attempt) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }
  if (attempt.audio_path) {
    const { error: storageError } = await supabase.storage
      .from("interview-audio")
      .remove([attempt.audio_path]);
    if (storageError) {
      return NextResponse.json({ error: "Private audio deletion failed." }, { status: 502 });
    }
  }
  const { error: deletionError } = await supabase.from("attempts").delete().eq("id", parsedId.data);
  if (deletionError) {
    return NextResponse.json({ error: "Attempt records could not be deleted." }, { status: 502 });
  }
  return NextResponse.json({ deleted: true });
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Production persistence is not configured." }, { status: 503 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio");
  const rawPayload = formData.get("payload");
  if (!(audio instanceof File) || typeof rawPayload !== "string") {
    return NextResponse.json({ error: "Audio and attempt payload are required." }, { status: 400 });
  }
  try {
    await validateAudioFile(audio);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The audio file is invalid." },
      { status: 400 },
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(rawPayload);
  } catch {
    return NextResponse.json({ error: "Attempt payload is malformed." }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Attempt payload failed validation." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const extension = audioExtension(audio);
  const audioPath = `${authData.user.id}/${parsed.data.attemptId}/answer.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("interview-audio")
    .upload(audioPath, audio, { contentType: audio.type, upsert: false });
  if (uploadError) {
    return NextResponse.json({ error: "Private audio upload failed." }, { status: 502 });
  }

  const rpcPayload = { ...parsed.data, audioPath };
  const { data, error } = await supabase.rpc("persist_attempt_result", { payload: rpcPayload });
  if (error) {
    await supabase.storage.from("interview-audio").remove([audioPath]);
    return NextResponse.json({ error: "Attempt persistence failed." }, { status: 502 });
  }
  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    attemptId: parsed.data.attemptId,
    attemptNumber: result?.attempt_number,
  });
}
