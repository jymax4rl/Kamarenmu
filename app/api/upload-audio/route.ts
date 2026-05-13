import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { jsonError, jsonOk } from "@/lib/api-handlers";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// iOS Safari records as audio/mp4, desktop Chrome as audio/webm.
// We accept any content-type and normalise to a safe extension.
function ext(contentType: string): string {
  if (contentType.includes("mp4") || contentType.includes("m4a")) return "m4a";
  if (contentType.includes("ogg")) return "ogg";
  if (contentType.includes("mpeg") || contentType.includes("mp3")) return "mp3";
  if (contentType.includes("wav")) return "wav";
  return "webm"; // default
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return jsonError("Audio storage not configured (BLOB_READ_WRITE_TOKEN missing)", 503);
    }

    const contentType = req.headers.get("content-type") ?? "audio/webm";
    const arrayBuffer = await req.arrayBuffer();

    if (arrayBuffer.byteLength === 0) {
      return jsonError("Empty audio file", 400);
    }
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return jsonError("Audio file too large (max 10 MB)", 400);
    }

    const filename = `dictionary-audio/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext(contentType)}`;

    const blob = await put(filename, Buffer.from(arrayBuffer), {
      access: "public",
      contentType: contentType.startsWith("audio/") ? contentType : "audio/webm",
    });

    return jsonOk({ url: blob.url });
  } catch (e) {
    console.error("[upload-audio]", e);
    return jsonError("Failed to upload audio", 500);
  }
}
