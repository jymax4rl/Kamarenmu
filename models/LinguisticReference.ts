import mongoose, { Schema, type Document, type Model } from "mongoose";

export type LinguisticRefCategory =
  | "rule"        // phonological / orthographic rule
  | "alphabet"    // per-letter guide
  | "vocabulary"  // themed word sets (months, days, numbers…)
  | "grammar"     // morphology / syntax notes
  | "culture";    // cultural / ethnographic context

export interface ILinguisticReference {
  category: LinguisticRefCategory;
  title: string;
  body: string;           // plain text or lightweight markdown
  triggerPatterns: string[]; // substrings — if any match the entry word/translation/definition, show this ref
  isGlobal: boolean;      // true → shown on every entry regardless of patterns
  isActive: boolean;
  sortOrder: number;
}

export interface ILinguisticReferenceDoc extends ILinguisticReference, Document {}

const LinguisticReferenceSchema = new Schema<ILinguisticReferenceDoc>(
  {
    category: {
      type: String,
      enum: ["rule", "alphabet", "vocabulary", "grammar", "culture"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    triggerPatterns: [{ type: String, trim: true }],
    isGlobal: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

LinguisticReferenceSchema.index({ category: 1, isActive: 1 });
LinguisticReferenceSchema.index({ isGlobal: 1, isActive: 1 });

export const LinguisticReference: Model<ILinguisticReferenceDoc> =
  mongoose.models.LinguisticReference ||
  mongoose.model<ILinguisticReferenceDoc>(
    "LinguisticReference",
    LinguisticReferenceSchema
  );
