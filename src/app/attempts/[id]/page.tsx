"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, Lightbulb, RotateCcw, Trash2 } from "lucide-react";
import { deleteAttempt, getAudio } from "@/lib/store";
import { getQuestion } from "@/lib/questions";
import { rubric } from "@/lib/rubric";
import { formatTime } from "@/lib/format";
import type { Attempt } from "@/lib/types";
import { deleteAvailableAttempt, loadAttempt } from "@/lib/attempts-client";
import { useToast } from "@/components/toast-provider";

export default function AttemptPage() {
  const id = useParams<{ id: string }>().id;
  const router = useRouter();
  const { showToast } = useToast();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    queueMicrotask(() => {
      void loadAttempt(id).then((loadedAttempt) => {
        setAttempt(loadedAttempt);
        if (loadedAttempt?.audioUrl) setAudioUrl(loadedAttempt.audioUrl);
        setLoaded(true);
      });
    });
    getAudio(id).then((audio) => {
      if (audio) {
        objectUrl = URL.createObjectURL(audio);
        setAudioUrl(objectUrl);
      }
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  if (!loaded) return <main className="page-shell"><div className="page-loader">Loading your feedback…</div></main>;
  if (!attempt) return <main className="page-shell"><h1>Attempt not found</h1><Link href="/dashboard">Return to dashboard</Link></main>;
  const question = getQuestion(attempt.questionSlug);
  const improvements = attempt.evaluation.feedback.filter((item) => item.type === "improvement");
  const strengths = attempt.evaluation.feedback.filter((item) => item.type === "strength");

  function seek(index: number) {
    const segment = attempt?.segments.find((item) => item.index === index);
    if (!segment) return;
    setActiveSegment(index);
    document.getElementById(`segment-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (audioRef.current) {
      audioRef.current.currentTime = segment.startSeconds;
      void audioRef.current.play();
    }
  }

  return (
    <main className="page-shell narrow">
      <Link href="/dashboard" className="back-link"><ChevronLeft size={17} /> Dashboard</Link>
      <section className="results-hero">
        <div>
          <p className="eyebrow">Attempt {attempt.attemptNumber} · {formatTime(attempt.durationSeconds)}</p>
          <h1>{question?.title}</h1>
          <p>{attempt.evaluation.summary}</p>
        </div>
        <div className="overall-score"><strong>{attempt.evaluation.overallScore.toFixed(1)}</strong><span>Overall score</span><small>out of 5</small></div>
      </section>
      <div className="score-grid">
        {attempt.evaluation.categoryScores.map((score) => (
          <div className="score-card" key={score.category}>
            <div><span>{rubric[score.category].label}</span><strong>{score.score}/5</strong></div>
            <div className="score-track"><i style={{ width: `${score.score * 20}%` }} /></div>
            <p>{score.explanation}</p>
          </div>
        ))}
      </div>

      <section className="recommendation">
        <Lightbulb />
        <div><p className="eyebrow">Priority for your next attempt</p><h2>{attempt.evaluation.prioritizedRecommendation}</h2></div>
      </section>

      <section className="feedback-section">
        <div><p className="eyebrow">What worked</p><h2>Strengths to keep</h2></div>
        <div className="feedback-grid">
          {strengths.map((item, index) => (
            <button className="feedback-card strength" onClick={() => seek(item.segmentIndexes[0])} key={index}>
              <span className="pill">{rubric[item.category].label}</span><h3>{item.title}</h3><p>{item.explanation}</p>
              <small>View evidence at {formatTime(attempt.segments.find((segment) => segment.index === item.segmentIndexes[0])?.startSeconds ?? 0)} <ArrowRight size={14} /></small>
            </button>
          ))}
        </div>
      </section>
      <section className="feedback-section">
        <div><p className="eyebrow">Where to focus</p><h2>Improvements</h2></div>
        <div className="feedback-grid">
          {improvements.map((item, index) => (
            <button className="feedback-card improvement" onClick={() => seek(item.segmentIndexes[0])} key={index}>
              <span className="pill">{rubric[item.category].label}</span><h3>{item.title}</h3><p>{item.explanation}</p>
              {item.suggestion && <em>{item.suggestion}</em>}
              <small>View evidence at {formatTime(attempt.segments.find((segment) => segment.index === item.segmentIndexes[0])?.startSeconds ?? 0)} <ArrowRight size={14} /></small>
            </button>
          ))}
        </div>
      </section>

      <section className="transcript-section">
        <div><p className="eyebrow">Evidence</p><h2>Your timestamped transcript</h2></div>
        {audioUrl && <audio ref={audioRef} controls src={audioUrl} />}
        <div className="transcript">
          {attempt.segments.map((segment) => (
            <button id={`segment-${segment.index}`} className={activeSegment === segment.index ? "active" : ""} onClick={() => seek(segment.index)} key={segment.index}>
              <time>{formatTime(segment.startSeconds)}</time><span>{segment.text}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="outline-section">
        <p className="eyebrow">Suggested structure</p><h2>Build your next answer</h2>
        <div className="outline">
          {attempt.evaluation.nextAttemptOutline.map((item, index) => (
            <div key={item.section}><span>{index + 1}</span><div><strong>{item.section}</strong><p>{item.guidance}</p></div></div>
          ))}
        </div>
      </section>
      <div className="bottom-actions">
        <button className="button button-ghost" onClick={async () => {
          if (!window.confirm("Delete this attempt and its audio? This cannot be undone.")) return;
          try {
            await deleteAvailableAttempt(attempt.id);
            deleteAttempt(attempt.id);
            showToast("Attempt deleted.", "success");
            router.push("/dashboard");
          } catch (caught) {
            showToast(caught instanceof Error ? caught.message : "The attempt could not be deleted.", "error");
          }
        }}><Trash2 size={17} /> Delete attempt</button>
        {attempt.attemptNumber > 1 && <Link className="button button-secondary" href={`/compare/${attempt.questionSlug}`}>Compare attempts</Link>}
        <Link className="button" href={`/practice/${attempt.questionSlug}`}><RotateCcw size={17} /> Try again</Link>
      </div>
    </main>
  );
}
