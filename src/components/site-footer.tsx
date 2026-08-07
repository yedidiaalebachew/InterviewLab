import Link from "next/link";
import { Globe, Smartphone, PanelsTopLeft, Building2 } from "lucide-react";

const tiers = [
  {
    icon: Globe,
    label: "Web app",
    status: "Available now",
    description: "Responsive practice, feedback, and comparison experience in any modern browser.",
  },
  {
    icon: Smartphone,
    label: "Installable PWA",
    status: "Available now",
    description: "Install InterviewLab to your home screen for offline-friendly, full-screen access.",
  },
  {
    icon: PanelsTopLeft,
    label: "Browser extension",
    status: "Planned",
    description: "Practice directly from job-listing and interview-preparation pages.",
  },
  {
    icon: Building2,
    label: "Organization dashboard",
    status: "Planned",
    description: "Aggregate coaching analytics for university career centers and bootcamps.",
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <strong>InterviewLab</strong>
          <span className="pill">v1.0 · Web + PWA</span>
        </div>
        <div className="footer-links">
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
      <div className="footer-roadmap">
        {tiers.map((tier) => (
          <div key={tier.label} className={tier.status === "Planned" ? "planned" : ""}>
            <tier.icon size={18} />
            <div>
              <div className="footer-roadmap-title">
                <strong>{tier.label}</strong>
                <span>{tier.status}</span>
              </div>
              <p>{tier.description}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="footer-note">
        Scores are coaching estimates grounded in your own transcript, not hiring recommendations.
      </p>
    </footer>
  );
}
