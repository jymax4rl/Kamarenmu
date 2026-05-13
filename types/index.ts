export interface President {
  _id: string;
  fullName: string;
  photo: string;
  biography: string;
  mandateStart: string;
  mandateEnd?: string;
  isCurrent: boolean;
  contactEmail?: string;
  phone?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Administrator {
  _id: string;
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

export interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: string;
  readTime: number;
}

export interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  isBreaking: boolean;
  category: string;
  isPublished: boolean;
  publishedAt: string;
}

export interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LinguisticReference {
  _id: string;
  category: "rule" | "alphabet" | "vocabulary" | "grammar" | "culture";
  title: string;
  body: string;
  triggerPatterns: string[];
  isGlobal: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface DictionaryEntry {
  _id: string;
  soninke: string;
  english: string;
  french?: string;
  audioUrl?: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  kemetRapprochement?: string;
  status: "pending" | "approved" | "rejected" | "flagged";
  upvotes: number;
  downvotes: number;
  submittedBy?: string;
  submittedByEmail?: string;
  validatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
