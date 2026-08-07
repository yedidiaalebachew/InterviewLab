insert into public.questions (slug, title, prompt, category, guidance, recommended_seconds) values
('tell-me-about-yourself', 'Tell me about yourself', 'Tell me about yourself.', 'Introduction', 'Connect your current focus, relevant experience, and motivation for the role.', 90),
('difficult-technical-problem', 'A difficult technical problem', 'Tell me about a difficult technical problem you solved.', 'Problem solving', 'Explain the context, your investigation, the decisions you owned, and the result.', 120),
('disagreed-with-teammate', 'Disagreement with a teammate', 'Describe a time you disagreed with a teammate.', 'Collaboration', 'Show how you understood both views, communicated, and reached a useful outcome.', 120),
('demonstrated-leadership', 'Demonstrated leadership', 'Tell me about a time you demonstrated leadership.', 'Leadership', 'Describe the need, how you influenced others, and the result.', 120),
('proud-project', 'A project you are proud of', 'Describe a project you are especially proud of.', 'Achievement', 'Focus on the challenge, your contribution, tradeoffs, and why the outcome mattered.', 120),
('failure-and-learning', 'Failure and learning', 'Tell me about a failure and what you learned.', 'Growth', 'Take responsibility, explain the lesson, and show what changed afterward.', 120),
('tight-deadline', 'Working under a tight deadline', 'Describe a time you worked under a tight deadline.', 'Execution', 'Explain prioritization, communication, tradeoffs, and the outcome.', 120),
('handled-ambiguity', 'Handling ambiguity', 'Tell me about a time you handled ambiguity.', 'Judgment', 'Show how you reduced uncertainty, made assumptions explicit, and moved forward.', 120),
('difficult-feedback', 'Receiving difficult feedback', 'Describe a time you received difficult feedback.', 'Growth', 'Explain your response, what you learned, and how your behavior changed.', 120),
('improved-process', 'Improving a process', 'Tell me about a time you improved a process.', 'Initiative', 'Describe the original friction, your intervention, adoption, and impact.', 120),
('resolved-conflict', 'Resolving conflict', 'Describe a conflict you helped resolve.', 'Collaboration', 'Focus on listening, de-escalation, decisions, and the relationship afterward.', 120),
('learned-quickly', 'Learning something quickly', 'Tell me about a time you had to learn something quickly.', 'Adaptability', 'Explain your learning strategy, how you applied it, and the result.', 120)
on conflict (slug) do update set
  title = excluded.title,
  prompt = excluded.prompt,
  category = excluded.category,
  guidance = excluded.guidance,
  recommended_seconds = excluded.recommended_seconds;
