import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAdministrator {
  fullName: string;
  photo: string;
  role: string;
  department: string;
  biography: string;
  email: string;
  phone?: string;
  isActive: boolean;
  order: number;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface IAdministratorDoc extends IAdministrator, Document {}

const AdminSocialSchema = new Schema(
  {
    facebook: String,
    twitter: String,
    linkedin: String,
  },
  { _id: false }
);

const AdministratorSchema = new Schema<IAdministratorDoc>(
  {
    fullName: { type: String, required: true },
    photo: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    biography: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    socialLinks: AdminSocialSchema,
  },
  { timestamps: true }
);

AdministratorSchema.index({ order: 1, isActive: 1 });

export const Administrator: Model<IAdministratorDoc> =
  mongoose.models.Administrator ||
  mongoose.model<IAdministratorDoc>("Administrator", AdministratorSchema);
