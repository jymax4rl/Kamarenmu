import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DictionaryEntry } from "@/models/DictionaryEntry";
import { DictionaryVote } from "@/models/DictionaryVote";
import { jsonError, jsonOk } from "@/lib/api-handlers";

const DOWNVOTE_THRESHOLD = 10;

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { entryId, vote, voterKey } = await req.json();

    if (!entryId || !vote || !voterKey?.trim()) {
      return jsonError("entryId, vote, and voterKey are required", 400);
    }
    if (!["up", "down"].includes(vote)) {
      return jsonError("vote must be 'up' or 'down'", 400);
    }

    const entry = await DictionaryEntry.findById(entryId);
    if (!entry) return jsonError("Entry not found", 404);
    if (!["approved", "flagged"].includes(entry.status)) {
      return jsonError("Cannot vote on this entry", 403);
    }

    const existing = await DictionaryVote.findOne({ entryId, voterKey });

    let upDelta = 0;
    let downDelta = 0;
    let userVote: "up" | "down" | null = vote as "up" | "down";

    if (existing) {
      if (existing.vote === vote) {
        // Same vote again → toggle off
        await DictionaryVote.deleteOne({ _id: existing._id });
        if (vote === "up") upDelta = -1;
        else downDelta = -1;
        userVote = null;
      } else {
        // Switch vote direction
        existing.vote = vote as "up" | "down";
        await existing.save();
        if (vote === "up") { upDelta = 1; downDelta = -1; }
        else { upDelta = -1; downDelta = 1; }
      }
    } else {
      // Brand new vote
      await DictionaryVote.create({ entryId, voterKey, vote });
      if (vote === "up") upDelta = 1;
      else downDelta = 1;
    }

    // Atomically update counters, clamped at 0
    const updated = await DictionaryEntry.findByIdAndUpdate(
      entryId,
      [
        {
          $set: {
            upvotes: { $max: [0, { $add: ["$upvotes", upDelta] }] },
            downvotes: { $max: [0, { $add: ["$downvotes", downDelta] }] },
          },
        },
      ],
      { new: true }
    );

    if (!updated) return jsonError("Entry not found", 404);

    // Auto-flag when downvotes hit the threshold and the entry is approved
    if (
      updated.status === "approved" &&
      updated.downvotes >= DOWNVOTE_THRESHOLD
    ) {
      updated.status = "flagged";
      await updated.save();
    }

    return jsonOk({
      upvotes: updated.upvotes,
      downvotes: updated.downvotes,
      status: updated.status,
      userVote,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to process vote", 500);
  }
}
