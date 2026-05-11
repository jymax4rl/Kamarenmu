import type {
  Administrator,
  Article,
  NewsItem,
  Paginated,
  President,
} from "@/types";
import { getBaseUrl } from "@/lib/utils";

type ApiEnvelope<T> = { ok: boolean; data?: T; error?: string };

async function apiGet<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const url = `${getBaseUrl()}${path}`;
    const res = await fetch(url, {
      ...init,
      next: init?.next ?? { revalidate: 60 },
    });
    const json = (await res.json()) as ApiEnvelope<T>;
    if (!json.ok || json.data === undefined) return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function getPresidentsList(limit = 20) {
  return apiGet<Paginated<President>>(`/api/presidents?limit=${limit}`);
}

export async function getCurrentPresident(): Promise<President | null> {
  const data = await getPresidentsList(20);
  if (!data?.items?.length) return null;
  return data.items.find((p) => p.isCurrent) ?? data.items[0];
}

export async function getAdministrators() {
  return apiGet<Paginated<Administrator>>("/api/administrators?limit=50");
}

export async function getArticles(params?: {
  category?: string;
  limit?: number;
  page?: number;
}) {
  const q = new URLSearchParams();
  if (params?.category) q.set("category", params.category);
  q.set("limit", String(params?.limit ?? 10));
  q.set("page", String(params?.page ?? 1));
  return apiGet<Paginated<Article>>(`/api/articles?${q.toString()}`);
}

export async function getArticleBySlug(slug: string) {
  return apiGet<Article>(`/api/articles?slug=${encodeURIComponent(slug)}`);
}

export async function getNews(params?: {
  category?: string;
  limit?: number;
  page?: number;
}) {
  const q = new URLSearchParams();
  if (params?.category) q.set("category", params.category);
  q.set("limit", String(params?.limit ?? 10));
  q.set("page", String(params?.page ?? 1));
  return apiGet<Paginated<NewsItem>>(`/api/news?${q.toString()}`);
}

export async function getNewsBySlug(slug: string) {
  return apiGet<NewsItem>(`/api/news?slug=${encodeURIComponent(slug)}`);
}
