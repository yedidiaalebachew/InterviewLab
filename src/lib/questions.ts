import type { Question } from "@/lib/types";

export const questions: Question[] = [
  {
    slug: "tell-me-about-yourself",
    title: "Tell me about yourself",
    prompt: "Tell me about yourself.",
    category: "Introduction",
    guidance: "Connect your current focus, relevant experience, and motivation for the role.",
    recommendedSeconds: 90,
  },
  {
    slug: "difficult-technical-problem",
    title: "A difficult technical problem",
    prompt: "Tell me about a difficult technical problem you solved.",
    category: "Problem solving",
    guidance: "Explain the context, your investigation, the decisions you owned, and the result.",
    recommendedSeconds: 120,
  },
  {
    slug: "disagreed-with-teammate",
    title: "Disagreement with a teammate",
    prompt: "Describe a time you disagreed with a teammate.",
    category: "Collaboration",
    guidance: "Show how you understood both views, communicated, and reached a useful outcome.",
    recommendedSeconds: 120,
  },
  {
    slug: "demonstrated-leadership",
    title: "Demonstrated leadership",
    prompt: "Tell me about a time you demonstrated leadership.",
    category: "Leadership",
    guidance: "Describe the need, how you influenced others, and the measurable or observable result.",
    recommendedSeconds: 120,
  },
  {
    slug: "proud-project",
    title: "A project you are proud of",
    prompt: "Describe a project you are especially proud of.",
    category: "Achievement",
    guidance: "Focus on the challenge, your contribution, tradeoffs, and why the outcome mattered.",
    recommendedSeconds: 120,
  },
  {
    slug: "failure-and-learning",
    title: "Failure and learning",
    prompt: "Tell me about a failure and what you learned.",
    category: "Growth",
    guidance: "Take responsibility, explain the lesson, and show what you changed afterward.",
    recommendedSeconds: 120,
  },
  {
    slug: "tight-deadline",
    title: "Working under a tight deadline",
    prompt: "Describe a time you worked under a tight deadline.",
    category: "Execution",
    guidance: "Explain prioritization, communication, tradeoffs, and the final outcome.",
    recommendedSeconds: 120,
  },
  {
    slug: "handled-ambiguity",
    title: "Handling ambiguity",
    prompt: "Tell me about a time you handled ambiguity.",
    category: "Judgment",
    guidance: "Show how you reduced uncertainty, made assumptions explicit, and moved forward.",
    recommendedSeconds: 120,
  },
  {
    slug: "difficult-feedback",
    title: "Receiving difficult feedback",
    prompt: "Describe a time you received difficult feedback.",
    category: "Growth",
    guidance: "Explain your response, what you learned, and how your behavior changed.",
    recommendedSeconds: 120,
  },
  {
    slug: "improved-process",
    title: "Improving a process",
    prompt: "Tell me about a time you improved a process.",
    category: "Initiative",
    guidance: "Describe the original friction, your intervention, adoption, and impact.",
    recommendedSeconds: 120,
  },
  {
    slug: "resolved-conflict",
    title: "Resolving conflict",
    prompt: "Describe a conflict you helped resolve.",
    category: "Collaboration",
    guidance: "Focus on listening, de-escalation, decisions, and the working relationship afterward.",
    recommendedSeconds: 120,
  },
  {
    slug: "learned-quickly",
    title: "Learning something quickly",
    prompt: "Tell me about a time you had to learn something quickly.",
    category: "Adaptability",
    guidance: "Explain your learning strategy, how you applied it, and the result.",
    recommendedSeconds: 120,
  },
];

export function getQuestion(slug: string) {
  return questions.find((question) => question.slug === slug);
}
