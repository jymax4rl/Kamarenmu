import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { jsonError, jsonOk } from "@/lib/api-handlers";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.startsWith("audio/")) {
      return jsonError("Only audio files are accepted", 400);
    }

    const arrayBuffer = await req.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return jsonError("Audio file too large (max 10 MB)", 400);
    }

    const ext = contentType.includes("mp4") ? "m4a"
              : contentType.includes("ogg") ? "ogg"
              : contentType.includes("mpeg") ? "mp3"
              : "webm";
    const filename = `dictionary-audio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(filename, Buffer.from(arrayBuffer), {
      access: "public",
      contentType,
    });

    return jsonOk({ url: blob.url });
  } catch (e) {
    console.error("[upload-audio]", e);
    return jsonError("Failed to upload audio", 500);
  }
}
