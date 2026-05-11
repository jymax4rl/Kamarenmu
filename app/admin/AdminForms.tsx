"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { DictionaryEntry } from "@/types";

function PendingDictionaryEntries() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dictionary?status=pending&limit=50");
      const json = await res.json();
      if (json.ok) setEntries(json.data.items);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(id: string, status: "approved" | "rejected") {
    setActionStatus((s) => ({ ...s, [id]: "loading" }));
    try {
      const res = await fetch("/api/dictionary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (json.ok) {
        setEntries((prev) => prev.filter((e) => e._id !== id));
        setActionStatus((s) => ({ ...s, [id]: status }));
      } else {
        setActionStatus((s) => ({ ...s, [id]: "error" }));
      }
    } catch {
      setActionStatus((s) => ({ ...s, [id]: "error" }));
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400 py-4 text-center">Chargement…</p>;
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        Aucune entrée en attente. ✓
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry._id} className="rounded-2xl space-y-2 border-amber-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900">{entry.soninke}</span>
                <span className="text-amber-500 text-sm">→</span>
                <span className="font-semibold text-amber-700 text-sm">{entry.english}</span>
                {entry.partOfSpeech && (
                  <Badge tone="muted" className="text-[10px]">{entry.partOfSpeech}</Badge>
                )}
              </div>
              {entry.definition && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{entry.definition}</p>
              )}
              {entry.submittedBy && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Soumis par: {entry.submittedBy}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              className="flex-1 py-2 text-xs bg-green-600 hover:bg-green-700"
              disabled={actionStatus[entry._id] === "loading"}
              onClick={() => decide(entry._id, "approved")}
            >
              ✓ Approuver
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 py-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
              disabled={actionStatus[entry._id] === "loading"}
              onClick={() => decide(entry._id, "rejected")}
            >
              ✕ Rejeter
            </Button>
          </div>
          {actionStatus[entry._id] === "error" && (
            <p className="text-xs text-red-500">Erreur lors de l&apos;action.</p>
          )}
        </Card>
      ))}
    </div>
  );
}

function FlaggedDictionaryEntries() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, { english: string; definition: string }>>({});
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dictionary?status=flagged&limit=50");
      const json = await res.json();
      if (json.ok) setEntries(json.data.items);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(entry: DictionaryEntry) {
    setEditing((e) => ({
      ...e,
      [entry._id]: { english: entry.english, definition: entry.definition ?? "" },
    }));
  }

  async function reapprove(id: string) {
    const edits = editing[id];
    setActionStatus((s) => ({ ...s, [id]: "loading" }));
    try {
      const res = await fetch("/api/dictionary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "approved",
          ...(edits?.english ? { english: edits.english } : {}),
          ...(edits?.definition !== undefined ? { definition: edits.definition } : {}),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setEntries((prev) => prev.filter((e) => e._id !== id));
        setEditing((e) => { const n = { ...e }; delete n[id]; return n; });
      } else {
        setActionStatus((s) => ({ ...s, [id]: "error" }));
      }
    } catch {
      setActionStatus((s) => ({ ...s, [id]: "error" }));
    }
  }

  async function reject(id: string) {
    setActionStatus((s) => ({ ...s, [id]: "loading" }));
    try {
      const res = await fetch("/api/dictionary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "rejected" }),
      });
      const json = await res.json();
      if (json.ok) setEntries((prev) => prev.filter((e) => e._id !== id));
      else setActionStatus((s) => ({ ...s, [id]: "error" }));
    } catch {
      setActionStatus((s) => ({ ...s, [id]: "error" }));
    }
  }

  if (loading) return <p className="text-sm text-gray-400 py-4 text-center">Chargement…</p>;
  if (entries.length === 0) return <p className="text-sm text-gray-400 py-4 text-center">Aucune entrée signalée. ✓</p>;

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isEditing = Boolean(editing[entry._id]);
        const ed = editing[entry._id];
        return (
          <Card key={entry._id} className="rounded-2xl space-y-2 border-orange-100 bg-orange-50/20">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">{entry.soninke}</span>
                  <span className="text-amber-500 text-sm">→</span>
                  <span className="font-semibold text-amber-700 text-sm">{entry.english}</span>
                  {entry.partOfSpeech && (
                    <Badge tone="muted" className="text-[10px]">{entry.partOfSpeech}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="text-green-700 font-semibold">▲ {entry.upvotes ?? 0}</span>
                  <span className="text-red-600 font-semibold">▼ {entry.downvotes ?? 0}</span>
                </div>
                {entry.definition && !isEditing && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{entry.definition}</p>
                )}
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => startEdit(entry)}
                  className="text-xs text-amber-600 font-semibold underline flex-shrink-0 hover:text-amber-800"
                >
                  Corriger
                </button>
              )}
            </div>

            {/* Inline edit form */}
            {isEditing && (
              <div className="space-y-2 border-t border-orange-100 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Traduction corrigée
                  </label>
                  <input
                    value={ed.english}
                    onChange={(e) => setEditing((m) => ({ ...m, [entry._id]: { ...ed, english: e.target.value } }))}
                    className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Définition corrigée
                  </label>
                  <textarea
                    value={ed.definition}
                    onChange={(e) => setEditing((m) => ({ ...m, [entry._id]: { ...ed, definition: e.target.value } }))}
                    rows={2}
                    className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-400 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                className="flex-1 py-2 text-xs bg-green-600 hover:bg-green-700"
                disabled={actionStatus[entry._id] === "loading"}
                onClick={() => reapprove(entry._id)}
              >
                ✓ {isEditing ? "Corriger & réapprouver" : "Réapprouver"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1 py-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                disabled={actionStatus[entry._id] === "loading"}
                onClick={() => reject(entry._id)}
              >
                ✕ Rejeter
              </Button>
            </div>
            {actionStatus[entry._id] === "error" && (
              <p className="text-xs text-red-500">Erreur lors de l&apos;action.</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

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

      {/* Dictionary — pending submissions */}
      <Card className="space-y-4 border-amber-200/60">
        <div>
          <h2 className="font-bold text-gray-900">Dictionnaire — mots en attente</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Approuvez ou rejetez les contributions des utilisateurs.
          </p>
        </div>
        <PendingDictionaryEntries />
      </Card>

      {/* Dictionary — flagged entries */}
      <Card className="space-y-4 border-orange-200/60">
        <div>
          <h2 className="font-bold text-gray-900">🚩 Dictionnaire — entrées signalées</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Ces définitions ont reçu 10 votes négatifs ou plus. Corrigez et réapprouvez, ou rejetez.
          </p>
        </div>
        <FlaggedDictionaryEntries />
      </Card>
    </div>
  );
}
