"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";

export function AdminForms() {
  const [status, setStatus] = useState<string>("");

  async function submitArticle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      title: String(fd.get("title")),
      slug: String(fd.get("slug")),
      excerpt: String(fd.get("excerpt")).slice(0, 200),
      content: String(fd.get("content")),
      coverImage: String(fd.get("coverImage")),
      author: String(fd.get("author")),
      category: String(fd.get("category")),
      tags: String(fd.get("tags") || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isPublished: true,
      publishedAt: new Date().toISOString(),
      readTime: Math.max(1, parseInt(String(fd.get("readTime")), 10) || 5),
    };
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.ok) {
      setStatus(json.error || "Failed to create article");
      return;
    }
    setStatus("Article created.");
    form.reset();
  }

  async function submitNews(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      title: String(fd.get("title")),
      slug: String(fd.get("slug")),
      excerpt: String(fd.get("excerpt")),
      content: String(fd.get("content")),
      coverImage: String(fd.get("coverImage")),
      author: String(fd.get("author")),
      isBreaking: fd.get("isBreaking") === "on",
      category: String(fd.get("category")),
      isPublished: true,
      publishedAt: new Date().toISOString(),
    };
    const res = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.ok) {
      setStatus(json.error || "Failed to create news");
      return;
    }
    setStatus("News item created.");
    form.reset();
  }

  return (
    <div className="space-y-6 pb-8 pt-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Lightweight publishing tools.</p>
      </div>

      {status && (
        <Card className="rounded-2xl py-3 px-4 text-sm text-gray-700 bg-amber-50 border-amber-100">
          {status}
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="font-bold text-gray-900">New article</h2>
        <form className="space-y-3" onSubmit={submitArticle}>
          <Input name="title" placeholder="Title" required />
          <Input name="slug" placeholder="Slug (url-safe)" required />
          <TextArea name="excerpt" placeholder="Excerpt (max 200 chars)" required maxLength={200} />
          <TextArea name="content" placeholder="HTML content" required />
          <Input name="coverImage" placeholder="Cover image URL" required />
          <Input name="author" placeholder="Author" required />
          <Input name="category" placeholder="Category" required />
          <Input name="tags" placeholder="Tags comma separated" />
          <Input name="readTime" type="number" placeholder="Read time (minutes)" min={1} />
          <Button type="submit" className="w-full">
            Publish article
          </Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-bold text-gray-900">New news</h2>
        <form className="space-y-3" onSubmit={submitNews}>
          <Input name="title" placeholder="Title" required />
          <Input name="slug" placeholder="Slug" required />
          <TextArea name="excerpt" placeholder="Excerpt" required />
          <TextArea name="content" placeholder="HTML content" required />
          <Input name="coverImage" placeholder="Cover image URL" required />
          <Input name="author" placeholder="Author" required />
          <Input name="category" placeholder="Category" required />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="isBreaking" className="rounded border-amber-300" />
            Breaking news
          </label>
          <Button type="submit" variant="secondary" className="w-full">
            Publish news
          </Button>
        </form>
      </Card>
    </div>
  );
}
