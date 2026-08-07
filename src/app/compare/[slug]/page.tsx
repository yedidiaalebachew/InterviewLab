"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, TrendingDown, TrendingUp } from "lucide-react";
import { loadAvailableAttempts } from "@/lib/attempts-client";
import { getQuestion } from "@/lib/questions";
import { rubric } from "@/lib/rubric";
import { formatTime } from "@/lib/format";
import type { Attempt } from "@/lib/types";

export default function ComparePage() {
  const slug = useParams<{ slug: string }>().slug;
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      void loadAvailableAttempts().then((availableAttempts) => {
        setAttempts(
          availableAttempts
          .filter((attempt) => attempt.questionSlug === slug)
          .sort((a, b) => a.attemptNumber - b.attemptNumber)
          .slice(-2),
        );
        setLoaded(true);
      });
    });
  }, [slug]);
  const question = getQuestion(slug);
  if (!loaded) return <main className="page-shell"><div className="page-loader">Loading comparison…</div></main>;
  if (attempts.length < 2) return <main className="page-shell"><h1>Record two attempts to compare progress.</h1><Link href={`/practice/${slug}`}>Practice now</Link></main>;
  const [before, after] = attempts;

  return (
    <main className="page-shell narrow">
      <Link href={`/attempts/${after.id}`} className="back-link"><ChevronLeft size={17} /> Latest results</Link>
      <section className="comparison-heading"><p className="eyebrow">Progress comparison</p><h1>{question?.title}</h1><p>Changes are directional coaching signals, not statistically significant measurements.</p></section>
      <div className="comparison-summary">
        <div><span>Attempt {before.attemptNumber}</span><strong>{before.evaluation.overallScore.toFixed(1)}</strong><small>{formatTime(before.durationSeconds)}</small></div>
        <div className="comparison-arrow">→</div>
        <div className="latest"><span>Attempt {after.attemptNumber}</span><strong>{after.evaluation.overallScore.toFixed(1)}</strong><small>{formatTime(after.durationSeconds)}</small></div>
      </div>
      <div className="delta-list">
        {after.evaluation.categoryScores.map((latest) => {
          const earlier = before.evaluation.categoryScores.find((score) => score.category === latest.category);
          const delta = latest.score - (earlier?.score ?? latest.score);
          return (
            <div key={latest.category}>
              <strong>{rubric[latest.category].label}</strong>
              <span>{earlier?.score} → {latest.score}</span>
              <em className={delta > 0 ? "positive" : delta < 0 ? "negative" : ""}>
                {delta > 0 ? <TrendingUp size={16} /> : delta < 0 ? <TrendingDown size={16} /> : null}
                {delta > 0 ? "+" : ""}{delta}
              </em>
            </div>
          );
        })}
      </div>
      <div className="bottom-actions"><Link href={`/practice/${slug}`} className="button">Record another attempt</Link></div>
    </main>
  );
}
