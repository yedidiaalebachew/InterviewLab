"use client";

import Link from "next/link";
import { ChevronLeft, Clock3, Info } from "lucide-react";
import { useParams } from "next/navigation";
import { AudioRecorder } from "@/components/audio-recorder";
import { getQuestion } from "@/lib/questions";
import { rubric } from "@/lib/rubric";

export default function PracticePage() {
  const slug = useParams<{ slug: string }>().slug;
  const question = getQuestion(slug);
  if (!question) return <main className="page-shell"><h1>Question not found</h1></main>;

  return (
    <main className="page-shell narrow">
      <Link href="/dashboard" className="back-link"><ChevronLeft size={17} /> Back to questions</Link>
      <section className="practice-heading">
        <span className="pill">{question.category}</span>
        <h1>{question.prompt}</h1>
        <div className="duration"><Clock3 size={17} /> Aim for about {Math.round(question.recommendedSeconds / 60)} minutes</div>
      </section>
      <div className="practice-layout">
        <AudioRecorder questionSlug={slug} />
        <aside>
          <div className="aside-card">
            <div className="aside-title"><Info size={18} /> What a strong answer shows</div>
            <p>{question.guidance}</p>
          </div>
          <div className="aside-card">
            <div className="aside-title">Scoring rubric</div>
            <div className="rubric-list">
              {Object.entries(rubric).map(([key, item]) => (
                <div key={key}><strong>{item.label}</strong><span>{item.description}</span></div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
