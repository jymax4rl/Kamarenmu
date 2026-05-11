import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IDictionaryVote {
  entryId: mongoose.Types.ObjectId;
  voterKey: string;
  vote: "up" | "down";
}

export interface IDictionaryVoteDoc extends IDictionaryVote, Document {}

const DictionaryVoteSchema = new Schema<IDictionaryVoteDoc>(
  {
    entryId: {
      type: Schema.Types.ObjectId,
      ref: "DictionaryEntry",
      required: true,
    },
    voterKey: { type: String, required: true, trim: true },
    vote: { type: String, enum: ["up", "down"], required: true },
  },
  { timestamps: true }
);

// One vote per voter per entry — enforced at DB level
DictionaryVoteSchema.index({ entryId: 1, voterKey: 1 }, { unique: true });

export const DictionaryVote: Model<IDictionaryVoteDoc> =
  mongoose.models.DictionaryVote ||
  mongoose.model<IDictionaryVoteDoc>("DictionaryVote", DictionaryVoteSchema);
