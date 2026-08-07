"use client";

import { isSupabaseConfigured } from "@/lib/supabase/browser";
import { getAttempts } from "@/lib/store";
import type { Attempt } from "@/lib/types";

export async function loadAvailableAttempts() {
  const local = getAttempts();
  if (!isSupabaseConfigured()) return local;

  const response = await fetch("/api/attempts", { cache: "no-store" });
  if (!response.ok) return local;
  const payload = (await response.json()) as { attempts?: Attempt[] };
  const remote = payload.attempts ?? [];
  const merged = new Map(local.map((attempt) => [attempt.id, attempt]));
  remote.forEach((attempt) => merged.set(attempt.id, attempt));
  return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function loadAttempt(id: string) {
  const local = getAttempts().find((attempt) => attempt.id === id) ?? null;
  if (!isSupabaseConfigured()) return local;

  const response = await fetch(`/api/attempts?id=${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!response.ok) return local;
  const payload = (await response.json()) as { attempts?: Attempt[] };
  return payload.attempts?.[0] ?? local;
}

export async function deleteAvailableAttempt(id: string) {
  if (!isSupabaseConfigured()) return;
  const response = await fetch(`/api/attempts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? "The attempt could not be deleted.");
  }
}
