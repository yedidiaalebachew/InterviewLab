import { describe, expect, it } from "vitest";
import { isTranscriptionProviderConfigured } from "@/lib/ai/transcribe";

describe("isTranscriptionProviderConfigured", () => {
  it("defaults to false when no provider key is present", () => {
    delete process.env.TRANSCRIPTION_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DEEPGRAM_API_KEY;
    expect(isTranscriptionProviderConfigured()).toBe(false);
  });

  it("recognizes an OpenAI key under the default provider", () => {
    process.env.OPENAI_API_KEY = "test-key";
    expect(isTranscriptionProviderConfigured()).toBe(true);
    delete process.env.OPENAI_API_KEY;
  });

  it("recognizes a Deepgram key when selected as the provider", () => {
    process.env.TRANSCRIPTION_PROVIDER = "deepgram";
    process.env.DEEPGRAM_API_KEY = "test-key";
    expect(isTranscriptionProviderConfigured()).toBe(true);
    delete process.env.TRANSCRIPTION_PROVIDER;
    delete process.env.DEEPGRAM_API_KEY;
  });
});
