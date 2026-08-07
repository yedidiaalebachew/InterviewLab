const allowedAudioTypes = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
]);

function normalizedType(file: File) {
  return file.type.toLowerCase().split(";")[0].trim();
}

export function audioExtension(file: File) {
  const type = normalizedType(file);
  if (type === "audio/mp4") return "m4a";
  if (type === "audio/mpeg") return "mp3";
  if (type === "audio/x-wav") return "wav";
  return type.split("/")[1] ?? "webm";
}

export async function validateAudioFile(file: File) {
  if (file.size === 0) throw new Error("The audio recording is empty.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Audio must be smaller than 15 MB.");
  if (!allowedAudioTypes.has(normalizedType(file))) {
    throw new Error("Unsupported audio format.");
  }

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = String.fromCharCode(...bytes);
  const isWebM = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  const isWave = ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WAVE";
  const isMp4 = ascii.slice(4, 8) === "ftyp";
  const isMpeg =
    ascii.startsWith("ID3") ||
    (bytes[0] === 0xff && typeof bytes[1] === "number" && (bytes[1] & 0xe0) === 0xe0);

  if (!isWebM && !isWave && !isMp4 && !isMpeg) {
    throw new Error("The uploaded file does not contain a recognized audio signature.");
  }
}
