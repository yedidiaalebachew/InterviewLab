import Link from "next/link";
import { ArrowRight, Check, Mic2, MousePointer2, RotateCcw } from "lucide-react";

export default function Home() {
  return (
    <main>
      <section className="landing-hero">
        <div className="hero-copy">
          <span className="pill pill-accent">Evidence, not generic advice</span>
          <h1>Practice your answer.<br /><em>See exactly where</em> to improve.</h1>
          <p>Record behavioral interview answers and receive transparent, rubric-based feedback grounded in your own timestamped words.</p>
          <div className="hero-actions">
            <Link href="/login" className="button">Start practicing free <ArrowRight size={18} /></Link>
            <a href="#how-it-works" className="button button-secondary">See how it works</a>
          </div>
          <div className="trust-row"><span><Check /> Private by default</span><span><Check /> No fabricated quotes</span><span><Check /> Transparent scoring</span></div>
        </div>
        <div className="evidence-demo">
          <div className="demo-window-bar"><span /><span /><span /><small>Evidence-grounded feedback</small></div>
          <div className="demo-score-row"><div><span>Ownership</span><strong>2<span>/5</span></strong></div><div className="score-track"><i style={{ width: "40%" }} /></div></div>
          <blockquote>“We redesigned the onboarding flow and then launched the feature.”</blockquote>
          <div className="timestamp-chip">00:38</div>
          <h3>Make your contribution explicit.</h3>
          <p>You described what the team did, but not the decision, artifact, or implementation that you personally owned.</p>
          <div className="demo-tip">Try: “I mapped the drop-off points and redesigned the account-creation step.”</div>
        </div>
      </section>
      <section className="proof-strip"><span>Built for deliberate practice</span><strong>7</strong><small>transparent rubric categories</small><strong>100%</strong><small>valid evidence references by design</small><strong>3 min</strong><small>maximum answer length</small></section>
      <section className="how-section" id="how-it-works">
        <p className="eyebrow">How it works</p><h2>A tighter feedback loop in three steps.</h2>
        <div className="steps">
          <div><span><Mic2 /></span><small>01</small><h3>Record naturally</h3><p>Choose a behavioral question and answer it from any modern browser.</p></div>
          <div><span><MousePointer2 /></span><small>02</small><h3>Inspect the evidence</h3><p>Every substantive observation links to a real timestamped transcript passage.</p></div>
          <div><span><RotateCcw /></span><small>03</small><h3>Retry and compare</h3><p>Practice the same question again and see category-level changes.</p></div>
        </div>
      </section>
      <section className="cta-section"><p className="eyebrow">Your next answer can be stronger</p><h2>Turn vague advice into specific action.</h2><Link href="/login" className="button button-light">Start your first practice <ArrowRight size={18} /></Link></section>
    </main>
  );
}
