export default function PrivacyPage() {
  return (
    <main className="page-shell prose-page">
      <p className="eyebrow">Privacy</p>
      <h1>Your interview stories belong to you.</h1>
      <p>Interview answers can contain personal and confidential information. InterviewLab is designed to minimize unnecessary data collection and keep recordings private.</p>
      <h2>Local demo</h2>
      <p>Without production credentials, attempts remain in your browser. Audio is stored in IndexedDB and structured results in local storage. Deleting an attempt removes both.</p>
      <h2>Production configuration</h2>
      <p>The included Supabase migration enforces per-user row-level security and private storage. Provider keys stay server-side. Full transcript content should never be sent to analytics or error monitoring.</p>
      <h2>AI processing</h2>
      <p>When an AI provider is configured, audio is sent to that provider for transcription. Review the provider’s retention and training controls before launch, disclose them here, and obtain user consent.</p>
      <h2>Limitations</h2>
      <p>Scores are coaching estimates, not hiring recommendations or objective assessments. InterviewLab does not evaluate accent, emotion, personality, facial expression, or protected characteristics.</p>
    </main>
  );
}
