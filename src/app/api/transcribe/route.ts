import { NextResponse } from "next/server";
import type { TranscriptSegment } from "@/lib/types";
import { validateAudioFile } from "@/lib/audio-validation";
import { isTranscriptionProviderConfigured, transcribeAudio } from "@/lib/ai/transcribe";

export const runtime = "nodejs";

const DEMO_TEXT =
  "During my internship, our onboarding feature was failing for some new users. I investigated the issue with the team and traced it to inconsistent validation between the client and API. I updated the validation flow, added tests, and worked with another engineer to deploy the fix. The feature launched successfully, and I learned to verify assumptions at system boundaries earlier.";

function demoSegments(): TranscriptSegment[] {
  const parts = DEMO_TEXT.match(/[^.]+[.]/g) ?? [DEMO_TEXT];
  return parts.map((text, index) => ({
    index,
    startSeconds: index * 8,
    endSeconds: (index + 1) * 8,
    text: text.trim(),
  }));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "A non-empty audio file is required." }, { status: 400 });
  }
  try {
    await validateAudioFile(audio);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid audio file." },
      { status: 400 },
    );
  }

  if (!isTranscriptionProviderConfigured()) {
    const segments = demoSegments();
    return NextResponse.json({
      text: segments.map((segment) => segment.text).join(" "),
      segments,
      provider: "demo",
    });
  }

  try {
    const result = await transcribeAudio(audio);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transcription provider failed." },
      { status: 502 },
    );
  }
}
