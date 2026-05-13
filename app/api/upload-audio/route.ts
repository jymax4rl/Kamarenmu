import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-handlers";

// Hard limit for base64 fallback path (keeps MongoDB docs reasonable)
const MAX_BYTES_BLOB = 10 * 1024 * 1024; // 10 MB when Blob is configured
const MAX_BYTES_B64 = 2 * 1024 * 1024;   // 2 MB fallback (≈ 4 min @ 64 kbps)

function ext(ct: string) {
  if (ct.includes("mp4") || ct.includes("m4a")) return "m4a";
  if (ct.includes("ogg")) return "ogg";
  if (ct.includes("mpeg") || ct.includes("mp3")) return "mp3";
  if (ct.includes("wav")) return "wav";
  return "webm";
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "audio/webm";
    const safeType = contentType.startsWith("audio/") ? contentType : "audio/webm";
    const arrayBuffer = await req.arrayBuffer();

    if (arrayBuffer.byteLength === 0) {
      return jsonError("Empty audio file", 400);
    }

    // ── Path 1: Vercel Blob (preferred, no size limit beyond 10 MB) ──────────
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      if (arrayBuffer.byteLength > MAX_BYTES_BLOB) {
        return jsonError("Audio too large (max 10 MB)", 400);
      }
      try {
        const { put } = await import("@vercel/blob");
        const filename = `dictionary-audio/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext(safeType)}`;
        const blob = await put(filename, Buffer.from(arrayBuffer), {
          access: "public",
          contentType: safeType,
        });
        return jsonOk({ url: blob.url, storage: "blob" });
      } catch (e) {
        console.error("[upload-audio] Blob failed, falling back to base64:", e);
        // fall through to base64 fallback
      }
    }

    // ── Path 2: base64 data URL stored directly in MongoDB ───────────────────
    // Works with no external services. Fine for short word pronunciations
    // (1–5 s ≈ 10–80 KB encoded).
    if (arrayBuffer.byteLength > MAX_BYTES_B64) {
      return jsonError("Audio too large for storage fallback (max 2 MB). Please set up Vercel Blob.", 400);
    }
    const b64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${safeType};base64,${b64}`;
    return jsonOk({ url: dataUrl, storage: "base64" });
  } catch (e) {
    console.error("[upload-audio]", e);
    return jsonError("Failed to process audio", 500);
  }
}
