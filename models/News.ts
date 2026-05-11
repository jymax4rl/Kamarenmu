import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface INews {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  isBreaking: boolean;
  category: string;
  isPublished: boolean;
  publishedAt: Date;
}

export interface INewsDoc extends INews, Document {}

const NewsSchema = new Schema<INewsDoc>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String, required: true },
    author: { type: String, required: true },
    isBreaking: { type: Boolean, default: false },
    category: { type: String, required: true },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

NewsSchema.index({ isPublished: 1, publishedAt: -1 });
NewsSchema.index({ isBreaking: 1 });

export const News: Model<INewsDoc> =
  mongoose.models.News || mongoose.model<INewsDoc>("News", NewsSchema);
