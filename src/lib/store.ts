"use client";

import type { Attempt } from "@/lib/types";

const ATTEMPTS_KEY = "interviewlab:attempts";
const USER_KEY = "interviewlab:user";

export function getAttempts(): Attempt[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) ?? "[]") as Attempt[];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: Attempt) {
  const attempts = getAttempts().filter((item) => item.id !== attempt.id);
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([attempt, ...attempts]));
}

export function deleteAttempt(id: string) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(getAttempts().filter((attempt) => attempt.id !== id)));
  void deleteAudio(id);
}

export function getDemoUser() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}

export function signInDemo() {
  localStorage.setItem(USER_KEY, "Demo candidate");
}

export function signOutDemo() {
  localStorage.removeItem(USER_KEY);
}

function openAudioDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("interviewlab", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("audio");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudio(id: string, audio: Blob) {
  const db = await openAudioDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction("audio", "readwrite").objectStore("audio").put(audio, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}

export async function getAudio(id: string) {
  const db = await openAudioDatabase();
  const result = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction("audio").objectStore("audio").get(id);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export async function deleteAudio(id: string) {
  const db = await openAudioDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction("audio", "readwrite").objectStore("audio").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}
