import { describe, expect, it } from "vitest";
import { audioExtension, validateAudioFile } from "@/lib/audio-validation";

describe("audio validation", () => {
  it("accepts a WebM signature with a codec MIME parameter", async () => {
    const file = new File(
      [new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x01])],
      "answer.webm",
      { type: "audio/webm;codecs=opus" },
    );
    await expect(validateAudioFile(file)).resolves.toBeUndefined();
    expect(audioExtension(file)).toBe("webm");
  });

  it("rejects content that only claims to be audio", async () => {
    const file = new File(["not audio"], "answer.webm", { type: "audio/webm" });
    await expect(validateAudioFile(file)).rejects.toThrow(/recognized audio signature/);
  });

  it("maps MP4 audio to the conventional m4a extension", () => {
    expect(audioExtension(new File([""], "answer.mp4", { type: "audio/mp4" }))).toBe("m4a");
  });
});
