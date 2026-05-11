"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineSearch } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { BsArrowRight, BsHandThumbsUp, BsHandThumbsDown, BsHandThumbsUpFill, BsHandThumbsDownFill } from "react-icons/bs";
import type { DictionaryEntry } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const POS_OPTIONS = ["noun", "verb", "adjective", "adverb", "phrase", "expression", "other"];
const STORAGE_KEY = "kama_voter_key";
const VOTES_STORAGE_KEY = "kama_dict_votes";

// Persisted per-entry vote state (stored in localStorage)
type LocalVoteMap = Record<string, "up" | "down">;

// Live vote state managed in memory
interface VoteState {
  upvotes: number;
  downvotes: number;
  userVote: "up" | "down" | null;
  status: DictionaryEntry["status"];
}

function getOrCreateVoterKey(): string {
  try {
    let key = localStorage.getItem(STORAGE_KEY);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, key);
    }
    return key;
  } catch {
    return "anon";
  }
}

function loadLocalVotes(): LocalVoteMap {
  try {
    return JSON.parse(localStorage.getItem(VOTES_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocalVote(entryId: string, vote: "up" | "down" | null) {
  try {
    const map = loadLocalVotes();
    if (vote === null) delete map[entryId];
    else map[entryId] = vote;
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

// ─── Vote buttons ────────────────────────────────────────────────────────────
function VoteButtons({
  entryId,
  voteState,
  onVote,
}: {
  entryId: string;
  voteState: VoteState;
  onVote: (entryId: string, dir: "up" | "down") => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function handle(dir: "up" | "down") {
    if (busy) return;
    setBusy(true);
    await onVote(entryId, dir);
    setBusy(false);
  }

  const UpIcon = voteState.userVote === "up" ? BsHandThumbsUpFill : BsHandThumbsUp;
  const DownIcon = voteState.userVote === "down" ? BsHandThumbsDownFill : BsHandThumbsDown;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handle("up"); }}
        disabled={busy}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 ${
          voteState.userVote === "up"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600"
        }`}
        aria-label="Voter pour"
      >
        <UpIcon className="text-sm" />
        <span>{voteState.upvotes}</span>
      </button>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handle("down"); }}
        disabled={busy}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 ${
          voteState.userVote === "down"
            ? "bg-red-100 text-red-600"
            : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500"
        }`}
        aria-label="Voter contre"
      >
        <DownIcon className="text-sm" />
        <span>{voteState.downvotes}</span>
      </button>

      {voteState.status === "flagged" && (
        <span
          className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5"
          title="Cette entrée a été signalée pour révision par la communauté"
        >
          🚩 révision
        </span>
      )}
    </div>
  );
}

// ─── Dictionary card ─────────────────────────────────────────────────────────
function DictionaryCard({
  entry,
  voteState,
  onVote,
}: {
  entry: DictionaryEntry;
  voteState: VoteState;
  onVote: (entryId: string, dir: "up" | "down") => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = entry.definition || entry.example || entry.kemetRapprochement;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={`rounded-2xl overflow-hidden ${
          voteState.status === "flagged"
            ? "border-orange-200/80"
            : "border-amber-100/80"
        }`}
      >
        {/* Header — tappable to expand */}
        <button
          type="button"
          onClick={() => hasMore && setExpanded((v) => !v)}
          className={`w-full text-left p-4 pb-2 ${hasMore ? "cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-gray-900 leading-tight">
                  {entry.soninke}
                </span>
                {entry.phonetic && (
                  <span className="text-sm text-gray-400 font-normal">
                    /{entry.phonetic}/
                  </span>
                )}
                {entry.partOfSpeech && (
                  <Badge tone="muted" className="text-[10px]">
                    {entry.partOfSpeech}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <BsArrowRight className="text-amber-500 flex-shrink-0 text-sm" />
                <span className="text-sm font-semibold text-amber-700">
                  {entry.english}
                </span>
              </div>
            </div>
            {hasMore && (
              <span className="text-xs text-gray-400 mt-1 flex-shrink-0 select-none">
                {expanded ? "moins" : "plus"}
              </span>
            )}
          </div>
        </button>

        {/* Vote bar — always visible */}
        <div className="px-4 pb-3">
          <VoteButtons entryId={entry._id} voteState={voteState} onVote={onVote} />
        </div>

        {/* Expandable detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-amber-50 pt-3">
                {entry.definition && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                      Définition
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {entry.definition}
                    </p>
                  </div>
                )}

                {entry.example && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                      Exemple
                    </p>
                    <p className="text-sm text-gray-600 italic leading-relaxed">
                      &ldquo;{entry.example}&rdquo;
                    </p>
                  </div>
                )}

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                    Rapprochement Kemet
                  </p>
                  {entry.kemetRapprochement ? (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {entry.kemetRapprochement}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600/70 italic">
                      Connexion avec l&apos;égyptien ancien — à venir.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ─── Add word bottom sheet ────────────────────────────────────────────────────
function AddWordSheet({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (entry: DictionaryEntry) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      soninke: String(fd.get("soninke") || "").trim(),
      english: String(fd.get("english") || "").trim(),
      phonetic: String(fd.get("phonetic") || "").trim() || undefined,
      partOfSpeech: String(fd.get("partOfSpeech") || "").trim() || undefined,
      definition: String(fd.get("definition") || "").trim() || undefined,
      example: String(fd.get("example") || "").trim() || undefined,
      submittedBy: String(fd.get("submittedBy") || "").trim() || undefined,
    };
    if (!payload.soninke || !payload.english) {
      setError("Le mot Soninké et la traduction anglaise sont requis.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Erreur");
      onSuccess(json.data as DictionaryEntry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
    >
      <motion.button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fermer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 340 }}
        className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[90dvh] flex flex-col"
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Proposer un mot</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Votre contribution sera validée avant publication.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition"
          >
            <IoClose className="text-xl text-gray-500" />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 px-5 pb-8 space-y-3"
        >
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Soninké <span className="text-red-400">*</span>
              </label>
              <Input name="soninke" placeholder="ex: naaxu" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Anglais <span className="text-red-400">*</span>
              </label>
              <Input name="english" placeholder="ex: cow" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Phonétique
              </label>
              <Input name="phonetic" placeholder="ex: naː-xu" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Nature
              </label>
              <select
                name="partOfSpeech"
                className="w-full rounded-xl border border-amber-100 bg-white px-3 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60"
              >
                <option value="">— choisir —</option>
                {POS_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Définition (optionnel)
            </label>
            <TextArea
              name="definition"
              placeholder="Décrivez le sens du mot…"
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Exemple d&apos;utilisation (optionnel)
            </label>
            <Input name="example" placeholder="ex: Naaxu xa dafe baane." />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Votre nom (optionnel)
            </label>
            <Input name="submittedBy" placeholder="ex: Moussa Kouyaté" />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={busy}>
            {busy ? "Envoi…" : "Soumettre le mot"}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────
export function DictionaryClient({
  initialEntries,
}: {
  initialEntries: DictionaryEntry[];
}) {
  const [entries, setEntries] = useState<DictionaryEntry[]>(initialEntries);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [voterKey, setVoterKey] = useState("");

  // Map of entryId → live vote state
  const [voteMap, setVoteMap] = useState<Record<string, VoteState>>(() => {
    const m: Record<string, VoteState> = {};
    for (const e of initialEntries) {
      m[e._id] = {
        upvotes: e.upvotes ?? 0,
        downvotes: e.downvotes ?? 0,
        userVote: null,
        status: e.status,
      };
    }
    return m;
  });

  // Hydrate voterKey and restore previously cast votes from localStorage
  useEffect(() => {
    const key = getOrCreateVoterKey();
    setVoterKey(key);
    const stored = loadLocalVotes();
    setVoteMap((prev) => {
      const next = { ...prev };
      for (const [id, v] of Object.entries(stored)) {
        if (next[id]) next[id] = { ...next[id], userVote: v };
      }
      return next;
    });
  }, []);

  const castVote = useCallback(
    async (entryId: string, dir: "up" | "down") => {
      if (!voterKey) return;
      const prev = voteMap[entryId];
      if (!prev) return;

      // Optimistic update
      const toggling = prev.userVote === dir;
      const switching = prev.userVote !== null && prev.userVote !== dir;
      const next: VoteState = { ...prev };
      if (toggling) {
        // Remove vote
        if (dir === "up") next.upvotes = Math.max(0, prev.upvotes - 1);
        else next.downvotes = Math.max(0, prev.downvotes - 1);
        next.userVote = null;
      } else if (switching) {
        if (dir === "up") { next.upvotes = prev.upvotes + 1; next.downvotes = Math.max(0, prev.downvotes - 1); }
        else { next.downvotes = prev.downvotes + 1; next.upvotes = Math.max(0, prev.upvotes - 1); }
        next.userVote = dir;
      } else {
        if (dir === "up") next.upvotes = prev.upvotes + 1;
        else next.downvotes = prev.downvotes + 1;
        next.userVote = dir;
      }
      setVoteMap((m) => ({ ...m, [entryId]: next }));
      saveLocalVote(entryId, next.userVote);

      try {
        const res = await fetch("/api/dictionary/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId, vote: dir, voterKey }),
        });
        const json = await res.json();
        if (json.ok) {
          // Reconcile with server truth
          setVoteMap((m) => ({
            ...m,
            [entryId]: {
              upvotes: json.data.upvotes,
              downvotes: json.data.downvotes,
              userVote: json.data.userVote,
              status: json.data.status,
            },
          }));
          saveLocalVote(entryId, json.data.userVote);
        } else {
          // Revert optimistic update on error
          setVoteMap((m) => ({ ...m, [entryId]: prev }));
        }
      } catch {
        setVoteMap((m) => ({ ...m, [entryId]: prev }));
      }
    },
    [voterKey, voteMap]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.soninke.toLowerCase().includes(q) ||
        e.english.toLowerCase().includes(q) ||
        e.definition?.toLowerCase().includes(q)
    );
  }, [entries, query]);

  function handleAddSuccess(entry: DictionaryEntry) {
    setShowAdd(false);
    setSubmitted(true);
    setEntries((prev) => [entry, ...prev]);
    setVoteMap((m) => ({
      ...m,
      [entry._id]: { upvotes: 0, downvotes: 0, userVote: null, status: entry.status },
    }));
    setTimeout(() => setSubmitted(false), 5000);
  }

  const approvedCount = entries.filter(
    (e) => e.status === "approved" || e.status === "flagged"
  ).length;

  return (
    <>
      {/* Search + Add */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un mot…"
            className="w-full rounded-2xl border border-amber-100 bg-white pl-10 pr-4 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60 placeholder:text-gray-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <IoClose className="text-lg" />
            </button>
          )}
        </div>
        <Button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex-shrink-0 rounded-2xl px-5 py-3 text-sm font-semibold"
        >
          + Ajouter
        </Button>
      </div>

      {/* Submission toast */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800"
          >
            Merci ! Votre mot a été soumis et sera validé par un administrateur.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Count line */}
      {!query && approvedCount > 0 && (
        <p className="text-xs text-gray-400 px-1">
          {approvedCount} mot{approvedCount !== 1 ? "s" : ""} dans le dictionnaire
        </p>
      )}
      {query && (
        <p className="text-xs text-gray-400 px-1">
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} pour &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Word list */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 text-gray-400 text-sm space-y-2">
          <p className="text-3xl">📖</p>
          {query ? (
            <p>Aucun résultat pour &ldquo;{query}&rdquo;.</p>
          ) : (
            <p>
              Le dictionnaire est vide pour l&apos;instant.
              <br />
              Soyez le premier à ajouter un mot !
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <DictionaryCard
              key={entry._id}
              entry={entry}
              voteState={
                voteMap[entry._id] ?? {
                  upvotes: entry.upvotes ?? 0,
                  downvotes: entry.downvotes ?? 0,
                  userVote: null,
                  status: entry.status,
                }
              }
              onVote={castVote}
            />
          ))}
        </div>
      )}

      {entries.some((e) => e.status === "pending") && (
        <p className="text-center text-xs text-amber-600/80 pb-2">
          Les mots en attente de validation ne sont visibles que par vous temporairement.
        </p>
      )}

      <AnimatePresence>
        {showAdd && (
          <AddWordSheet onClose={() => setShowAdd(false)} onSuccess={handleAddSuccess} />
        )}
      </AnimatePresence>
    </>
  );
}
