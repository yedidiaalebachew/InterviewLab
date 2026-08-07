import type { TranscriptSegment } from "@/lib/types";

export type TranscriptionResult = {
  text: string;
  segments: TranscriptSegment[];
  provider: string;
};

function toSegments(raw: Array<{ start: number; end: number; text: string }>): TranscriptSegment[] {
  return raw.map((segment, index) => ({
    index,
    startSeconds: segment.start,
    endSeconds: segment.end,
    text: segment.text.trim(),
  }));
}

async function transcribeWithOpenAI(audio: File): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const providerData = new FormData();
  providerData.append("file", audio, audio.name || "answer.webm");
  providerData.append("model", process.env.TRANSCRIPTION_MODEL ?? "whisper-1");
  providerData.append("response_format", "verbose_json");
  providerData.append("timestamp_granularities[]", "segment");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: providerData,
  });
  if (!response.ok) throw new Error("Transcription provider failed.");

  const result = (await response.json()) as {
    text: string;
    segments?: Array<{ start: number; end: number; text: string }>;
  };
  const segments = toSegments(result.segments ?? []);
  if (!result.text?.trim() || segments.length === 0) {
    throw new Error("No intelligible timestamped transcript was returned.");
  }
  return { text: result.text, segments, provider: "openai" };
}

async function transcribeWithDeepgram(audio: File): Promise<TranscriptionResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new Error("DEEPGRAM_API_KEY is not configured.");

  const buffer = await audio.arrayBuffer();
  const params = new URLSearchParams({
    model: process.env.TRANSCRIPTION_MODEL ?? "nova-2",
    smart_format: "true",
    utterances: "true",
  });
  const response = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": audio.type || "audio/webm",
    },
    body: buffer,
  });
  if (!response.ok) throw new Error("Transcription provider failed.");

  const result = (await response.json()) as {
    results?: {
      channels?: Array<{ alternatives?: Array<{ transcript: string }> }>;
      utterances?: Array<{ start: number; end: number; transcript: string }>;
    };
  };
  const text = result.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  const utterances = result.results?.utterances ?? [];
  const segments = toSegments(
    utterances.map((utterance) => ({
      start: utterance.start,
      end: utterance.end,
      text: utterance.transcript,
    })),
  );
  if (!text.trim() || segments.length === 0) {
    throw new Error("No intelligible timestamped transcript was returned.");
  }
  return { text, segments, provider: "deepgram" };
}

/**
 * Selects a transcription provider by environment configuration. Supported
 * providers are independent third-party services (OpenAI, Deepgram) chosen
 * so no single vendor's cloud platform is required to run InterviewLab.
 */
export async function transcribeAudio(audio: File): Promise<TranscriptionResult> {
  const provider = (process.env.TRANSCRIPTION_PROVIDER ?? "openai").toLowerCase();
  if (provider === "deepgram") return transcribeWithDeepgram(audio);
  if (provider === "openai") return transcribeWithOpenAI(audio);
  throw new Error(`Unknown transcription provider: ${provider}`);
}

export function isTranscriptionProviderConfigured() {
  const provider = (process.env.TRANSCRIPTION_PROVIDER ?? "openai").toLowerCase();
  if (provider === "deepgram") return Boolean(process.env.DEEPGRAM_API_KEY);
  return Boolean(process.env.OPENAI_API_KEY);
}
