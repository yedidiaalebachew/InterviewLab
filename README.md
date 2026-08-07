# InterviewLab

InterviewLab is a responsive behavioral-interview coaching application. Users record an answer, receive a timestamped transcript and transparent rubric scores, inspect feedback linked to exact transcript segments, retry the question, and compare attempts.

The application runs immediately in a credential-free local demo mode. Add transcription-provider and Supabase credentials to activate provider transcription and the included production data model.

## Core guarantees

- Feedback references stable transcript segment indexes.
- Displayed evidence comes from stored transcript text, never generated quotations.
- Structured evaluator output is validated before display.
- Every evaluation contains exactly one score for all seven rubric categories.
- Overall scores are calculated deterministically in application code.
- Invalid or duplicate evidence references are rejected.
- Coaching avoids accent, emotion, personality, and protected-characteristic analysis.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Browser `MediaRecorder` API
- Zod structured-output validation
- Timestamped transcription via OpenAI or Deepgram (selectable, both optional)
- Supabase PostgreSQL, Auth, and private Storage production schema
- Vitest for unit testing, with a local `npm run validate` script for full checks
- Vercel-compatible deployment

## Product routes

| Route | Purpose |
| --- | --- |
| `/` | Public product landing page |
| `/login` | Local demo entry or Supabase email magic-link sign-in |
| `/dashboard` | Question library and progress summary |
| `/practice/[slug]` | Recording, preview, and processing workflow |
| `/attempts/[id]` | Scores, feedback, audio, and timestamped evidence |
| `/compare/[slug]` | Category deltas between the latest two attempts |
| `/privacy` | Data-processing and product limitation disclosures |

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. Without credentials, transcription returns a labeled sample transcript and evaluation uses a deterministic local coaching heuristic. Recordings and attempts remain in browser IndexedDB/local storage.

## Environment variables

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TRANSCRIPTION_PROVIDER=openai
OPENAI_API_KEY=
DEEPGRAM_API_KEY=
TRANSCRIPTION_MODEL=whisper-1
EVALUATION_MODEL=
```

`TRANSCRIPTION_PROVIDER` selects `openai` (default, uses `OPENAI_API_KEY` and `TRANSCRIPTION_MODEL`, e.g. `whisper-1`) or `deepgram` (uses `DEEPGRAM_API_KEY` and `TRANSCRIPTION_MODEL`, e.g. `nova-2`). Only the selected provider's key is required.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, or `DEEPGRAM_API_KEY` to client components.

## Supabase setup

1. Create development and production Supabase projects.
2. Apply `supabase/migrations/202608070001_initial_schema.sql`.
3. Apply `supabase/seed.sql`.
4. Add the local and Vercel authentication callback URLs in Supabase.
5. Confirm the `interview-audio` bucket is private.
6. Test row-level security with two separate accounts before launch.

The migration includes normalized attempts, transcript segments, evaluations, category scores, feedback items, user-scoped RLS policies, and private per-user storage policies.

## Processing architecture

```text
Browser recording
  -> validated audio upload
  -> timestamped transcription
  -> stable transcript segments
  -> structured rubric evaluation
  -> Zod and evidence validation
  -> deterministic weighted score
  -> results and comparison UI
```

`POST /api/transcribe` validates the file and uses OpenAI or Deepgram (per `TRANSCRIPTION_PROVIDER`) when configured. `POST /api/evaluate` uses strict JSON-schema model output when the key is configured and the validated local evaluator otherwise. `POST /api/attempts` stores authenticated production attempts and private audio through the atomic Supabase RPC in the second migration; `GET /api/attempts` restores RLS-filtered history and creates short-lived audio URLs only for requested results.

## Evaluation methodology

`tests/benchmark/answers.json` contains 20 human-labeled examples covering strong STAR structure, vague impact, excessive team language, irrelevant answers, strong reflection, and other common patterns.

Recommended production evaluation:

- Evidence-reference validity: must remain 100% after deterministic validation.
- Human–AI mean absolute score error, per category and overall.
- Three repeated runs across at least ten answers to measure score variance.
- Feedback-category precision against labeled weaknesses.
- Median transcription, evaluation, and total latency.
- Estimated provider cost per attempt.

Do not report undefined “accuracy.” Report the measured sample, metric, and limitations.

## Testing

```bash
npm run validate
```

This runs lint, the unit test suite, and a production build in one local command (equivalent to `npm run lint && npm test && npm run build`). Unit tests cover weighting, schema completeness, score ranges, invalid references, duplicate references, audio-signature validation, and the local evaluator. No hosted CI service is required or configured — run `npm run validate` locally or wire it into whatever automation platform you prefer.

## Privacy decisions

- Audio is private and should be accessed through short-lived signed URLs.
- Full transcript content must not be sent to analytics or error monitoring.
- Users can delete local and production attempts together with their associated private audio.
- Provider retention and model-training settings must be reviewed and disclosed before launch.
- Scores are coaching estimates, not hiring recommendations.

## Known limitations

- Browser-local persistence remains as an offline/demo cache; production submissions are also written to Supabase when configured.
- The evaluator fallback is deterministic and useful for product demonstration, but not a substitute for a benchmarked production model.
- Browser recording formats vary, especially on older Safari versions.
- Small score changes should not be treated as statistically significant.

## Deployment

Connect the repository to Vercel, configure environment variables, and use the generated Vercel domain first. Add a custom domain only after production authentication callbacks, microphone access, row-level security, deletion, and provider retention behavior have been verified.

## License

MIT — see [LICENSE](./LICENSE).
