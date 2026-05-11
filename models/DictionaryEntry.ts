import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IDictionaryEntry {
  soninke: string;
  english: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  kemetRapprochement?: string;
  status: "pending" | "approved" | "rejected";
  submittedBy?: string;
  submittedByEmail?: string;
  validatedBy?: string;
}

export interface IDictionaryEntryDoc extends IDictionaryEntry, Document {}

const DictionaryEntrySchema = new Schema<IDictionaryEntryDoc>(
  {
    soninke: { type: String, required: true, trim: true },
    english: { type: String, required: true, trim: true },
    phonetic: { type: String, trim: true },
    partOfSpeech: { type: String, trim: true },
    definition: { type: String, trim: true },
    example: { type: String, trim: true },
    kemetRapprochement: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    submittedBy: { type: String, trim: true },
    submittedByEmail: { type: String, trim: true },
    validatedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

DictionaryEntrySchema.index({ soninke: "text", english: "text" });
DictionaryEntrySchema.index({ status: 1, createdAt: -1 });

export const DictionaryEntry: Model<IDictionaryEntryDoc> =
  mongoose.models.DictionaryEntry ||
  mongoose.model<IDictionaryEntryDoc>("DictionaryEntry", DictionaryEntrySchema);
