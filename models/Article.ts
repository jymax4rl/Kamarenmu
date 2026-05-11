import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: Date;
  readTime: number;
}

export interface IArticleDoc extends IArticle, Document {}

const ArticleSchema = new Schema<IArticleDoc>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true },
    coverImage: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, required: true },
    readTime: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

ArticleSchema.index({ category: 1, publishedAt: -1 });
ArticleSchema.index({ isPublished: 1, publishedAt: -1 });

export const Article: Model<IArticleDoc> =
  mongoose.models.Article ||
  mongoose.model<IArticleDoc>("Article", ArticleSchema);
