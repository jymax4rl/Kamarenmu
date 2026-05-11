import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IPresident {
  fullName: string;
  photo: string;
  biography: string;
  mandateStart: Date;
  mandateEnd?: Date;
  isCurrent: boolean;
  contactEmail?: string;
  phone?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface IPresidentDoc extends IPresident, Document {}

const SocialSchema = new Schema(
  {
    facebook: String,
    twitter: String,
    instagram: String,
  },
  { _id: false }
);

const PresidentSchema = new Schema<IPresidentDoc>(
  {
    fullName: { type: String, required: true },
    photo: { type: String, required: true },
    biography: { type: String, required: true },
    mandateStart: { type: Date, required: true },
    mandateEnd: { type: Date },
    isCurrent: { type: Boolean, default: false },
    contactEmail: { type: String },
    phone: { type: String },
    socialLinks: SocialSchema,
  },
  { timestamps: true }
);

PresidentSchema.index({ isCurrent: 1 });

export const President: Model<IPresidentDoc> =
  mongoose.models.President ||
  mongoose.model<IPresidentDoc>("President", PresidentSchema);
