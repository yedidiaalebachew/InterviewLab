"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAttempts, saveAttempt, saveAudio } from "@/lib/store";
import { formatTime } from "@/lib/format";
import type { Evaluation, TranscriptSegment } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/browser";
import { audioExtension } from "@/lib/audio-validation";
import { useToast } from "@/components/toast-provider";

type Status = "idle" | "recording" | "ready" | "uploading" | "transcribing" | "evaluating" | "saving";

export function AudioRecorder({ questionSlug }: { questionSlug: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (status !== "recording") return;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current >= 179) recorderRef.current?.stop();
        return Math.min(current + 1, 180);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser does not support microphone recording. Try a current version of Chrome, Edge, or Safari.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      setSeconds(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setBlob(audio);
        setPreviewUrl(URL.createObjectURL(audio));
        setStatus("ready");
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setStatus("recording");
    } catch {
      setError("Microphone access was denied. Allow access in your browser settings and try again.");
    }
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBlob(null);
    setPreviewUrl(null);
    setSeconds(0);
    setStatus("idle");
    setError(null);
  }

  async function submit() {
    if (!blob) return;
    try {
      setError(null);
      setStatus("uploading");
      const formData = new FormData();
      const audioFile = new File([blob], `answer.${audioExtension(new File([blob], "answer", { type: blob.type }))}`, { type: blob.type });
      formData.append("audio", audioFile);
      setStatus("transcribing");
      const transcriptResponse = await fetch("/api/transcribe", { method: "POST", body: formData });
      const transcriptPayload = (await transcriptResponse.json()) as {
        error?: string;
        text?: string;
        segments?: TranscriptSegment[];
      };
      if (!transcriptResponse.ok || !transcriptPayload.text || !transcriptPayload.segments) {
        throw new Error(transcriptPayload.error ?? "Transcription failed.");
      }

      setStatus("evaluating");
      const evaluationResponse = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcriptText: transcriptPayload.text,
          segments: transcriptPayload.segments,
          durationSeconds: seconds,
          questionSlug,
        }),
      });
      const evaluationPayload = (await evaluationResponse.json()) as {
        error?: string;
        evaluation?: Evaluation;
        provider?: string;
      };
      if (!evaluationResponse.ok || !evaluationPayload.evaluation) {
        throw new Error(evaluationPayload.error ?? "Evaluation failed.");
      }

      setStatus("saving");
      const attempts = getAttempts().filter((attempt) => attempt.questionSlug === questionSlug);
      const id = crypto.randomUUID();
      let attemptNumber = attempts.length + 1;
      if (isSupabaseConfigured()) {
        const persistenceForm = new FormData();
        persistenceForm.append("audio", audioFile);
        persistenceForm.append("payload", JSON.stringify({
          attemptId: id,
          questionSlug,
          durationSeconds: seconds,
          transcriptText: transcriptPayload.text,
          segments: transcriptPayload.segments,
          evaluation: evaluationPayload.evaluation,
          modelName: evaluationPayload.provider ?? "unknown",
        }));
        const persistenceResponse = await fetch("/api/attempts", {
          method: "POST",
          body: persistenceForm,
        });
        const persistencePayload = (await persistenceResponse.json()) as {
          error?: string;
          attemptNumber?: number;
        };
        if (!persistenceResponse.ok) {
          throw new Error(persistencePayload.error ?? "Saving the attempt failed.");
        }
        attemptNumber = persistencePayload.attemptNumber ?? attemptNumber;
      }
      saveAttempt({
        id,
        questionSlug,
        attemptNumber,
        status: "completed",
        durationSeconds: seconds,
        transcriptText: transcriptPayload.text,
        segments: transcriptPayload.segments,
        evaluation: evaluationPayload.evaluation,
        createdAt: new Date().toISOString(),
      });
      await saveAudio(id, blob);
      showToast("Attempt submitted. Evidence-grounded feedback is ready.", "success");
      router.push(`/attempts/${id}`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Processing failed.";
      setError(message);
      showToast(message, "error");
      setStatus("ready");
    }
  }

  const processing = ["uploading", "transcribing", "evaluating", "saving"].includes(status);

  return (
    <div className="recorder-card">
      <div className={`record-orb ${status === "recording" ? "recording" : ""}`} aria-hidden="true">
        <Mic size={30} />
      </div>
      <p className="eyebrow" aria-live="polite">{status === "recording" ? "Recording" : status === "ready" ? "Ready to submit" : "Your answer"}</p>
      <div className="timer" role="timer" aria-label={`Recording length ${formatTime(seconds)} of 3 minutes maximum`}>{formatTime(seconds)} <span>/ 03:00</span></div>
      {previewUrl && <audio className="audio-preview" controls src={previewUrl} aria-label="Preview of your recorded answer" />}
      {processing && (
        <div className="processing" role="status" aria-live="polite">
          {(["uploading", "transcribing", "evaluating", "saving"] as const).map((step, index) => (
            <div className={step === status ? "active" : index < ["uploading", "transcribing", "evaluating", "saving"].indexOf(status) ? "done" : ""} key={step}>
              <span aria-hidden="true" /> {step[0].toUpperCase() + step.slice(1)}
            </div>
          ))}
        </div>
      )}
      {!processing && (
        <div className="recorder-actions">
          {status === "idle" && <button className="button" onClick={startRecording}><Mic size={18} aria-hidden="true" /> Start recording</button>}
          {status === "recording" && <button className="button button-danger" onClick={() => recorderRef.current?.stop()}><Square size={17} aria-hidden="true" /> Stop recording</button>}
          {status === "ready" && (
            <>
              <button className="button button-secondary" onClick={reset}><RotateCcw size={17} aria-hidden="true" /> Record again</button>
              <button className="button" onClick={submit}><Upload size={17} aria-hidden="true" /> Submit answer</button>
            </>
          )}
        </div>
      )}
      {error && <div className="error-message" role="alert">{error}</div>}
      <p className="demo-note">Audio and evaluator providers are selected securely on the server. Credential-free development uses an explicit local demonstration mode.</p>
    </div>
  );
}
