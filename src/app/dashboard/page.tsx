"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Clock3, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { questions } from "@/lib/questions";
import { getDemoUser } from "@/lib/store";
import type { Attempt } from "@/lib/types";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/browser";
import { loadAvailableAttempts } from "@/lib/attempts-client";

export default function DashboardPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      void (async () => {
        if (isSupabaseConfigured()) {
          const { data } = await createSupabaseBrowserClient().auth.getUser();
          if (!data.user) {
            window.location.href = "/login";
            return;
          }
        } else if (!getDemoUser()) {
          window.location.href = "/login";
          return;
        }
        setAttempts(await loadAvailableAttempts());
        setReady(true);
      })();
    });
  }, []);
  const average = useMemo(
    () => attempts.length ? attempts.reduce((sum, attempt) => sum + attempt.evaluation.overallScore, 0) / attempts.length : 0,
    [attempts],
  );
  const categoryAverages = useMemo(() => {
    return questions.length && attempts.length
      ? Object.entries(
          attempts.flatMap((attempt) => attempt.evaluation.categoryScores).reduce<Record<string, { total: number; count: number }>>(
            (result, score) => {
              const current = result[score.category] ?? { total: 0, count: 0 };
              result[score.category] = { total: current.total + score.score, count: current.count + 1 };
              return result;
            },
            {},
          ),
        )
          .map(([category, value]) => ({ category, average: value.total / value.count }))
          .sort((a, b) => a.average - b.average)
      : [];
  }, [attempts]);
  if (!ready) return null;

  return (
    <main className="page-shell">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Practice dashboard</p>
          <h1>Make every answer more convincing.</h1>
          <p>Choose a question, speak naturally, then use evidence from your own words to improve.</p>
        </div>
        <div className="stats-grid">
          <div><Sparkles /><strong>{attempts.length}</strong><span>Completed attempts</span></div>
          <div><BarChart3 /><strong>{average ? average.toFixed(1) : "—"}</strong><span>Average score</span></div>
          <div><Clock3 /><strong>{new Set(attempts.map((attempt) => attempt.questionSlug)).size}</strong><span>Questions practiced</span></div>
        </div>
      </section>

      {attempts.length > 0 && (
        <section className="dashboard-insights">
          <div>
            <p className="eyebrow">Current focus</p>
            <h2>{categoryAverages[0]?.category ?? "Keep practicing"}</h2>
            <p>Your lowest average rubric category is the clearest place to focus your next retry.</p>
          </div>
          <div className="recent-attempts">
            <p className="eyebrow">Recent attempts</p>
            {attempts.slice(0, 3).map((attempt) => (
              <Link href={`/attempts/${attempt.id}`} key={attempt.id}>
                <span>{questions.find((question) => question.slug === attempt.questionSlug)?.title}</span>
                <strong>{attempt.evaluation.overallScore.toFixed(1)}</strong>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section-heading">
        <div><p className="eyebrow">Question library</p><h2>What would you like to practice?</h2></div>
        <span>{questions.length} questions</span>
      </section>
      <div className="question-grid">
        {questions.map((question, index) => {
          const history = attempts.filter((attempt) => attempt.questionSlug === question.slug);
          return (
            <Link className="question-card" href={`/practice/${question.slug}`} key={question.slug}>
              <div className="question-number">{String(index + 1).padStart(2, "0")}</div>
              <span className="pill">{question.category}</span>
              <h3>{question.title}</h3>
              <p>{question.guidance}</p>
              <div className="question-footer">
                <span>{history.length ? `${history.length} attempt${history.length > 1 ? "s" : ""}` : "Not practiced yet"}</span>
                <ArrowRight size={18} />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
