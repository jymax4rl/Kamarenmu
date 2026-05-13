"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineSearch } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import {
  BsArrowRight,
  BsHandThumbsUp,
  BsHandThumbsDown,
  BsHandThumbsUpFill,
  BsHandThumbsDownFill,
  BsMicFill,
  BsStopFill,
  BsArrowClockwise,
  BsVolumeUpFill,
  BsCheckCircleFill,
} from "react-icons/bs";
import type { DictionaryEntry, LinguisticReference } from "@/types";
import {
  PARTS_OF_SPEECH,
  WORD_TYPES,
  DIALECTS,
  SEMANTIC_CATEGORIES,
  labelOf,
} from "@/lib/dictionary-vocab";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = "sm", className = "" }: { size?: "sm" | "md"; className?: string }) {
  const s = size === "md" ? "h-5 w-5 border-2" : "h-4 w-4 border-2";
  return (
    <span
      className={`inline-block rounded-full border-current border-t-transparent animate-spin ${s} ${className}`}
      aria-hidden
    />
  );
}


// ─── localStorage helpers ────────────────────────────────────────────────────

const LS_VOTER_KEY = "kama_voter_key";
const LS_VOTES_KEY = "kama_dict_votes";       // { [entryId]: "up"|"down" }
const LS_PENDING_KEY = "kama_dict_pending";   // DictionaryEntry[]

type LocalVoteMap = Record<string, "up" | "down">;

function ls<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
}

function lsSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function getOrCreateVoterKey(): string {
  if (typeof window === "undefined") return "anon";
  let k = localStorage.getItem(LS_VOTER_KEY);
  if (!k) { k = crypto.randomUUID(); localStorage.setItem(LS_VOTER_KEY, k); }
  return k;
}

// Pending submissions the current user submitted (survives page reloads)
function loadPending(): DictionaryEntry[] {
  return ls<DictionaryEntry[]>(LS_PENDING_KEY, []);
}

function savePending(entry: DictionaryEntry) {
  const list = loadPending();
  if (!list.find((e) => e._id === entry._id)) {
    lsSet(LS_PENDING_KEY, [entry, ...list]);
  }
}

function prunePending(approvedIds: Set<string>) {
  // Remove entries that have since been approved (they now come from the server)
  const list = loadPending().filter((e) => !approvedIds.has(e._id));
  lsSet(LS_PENDING_KEY, list);
}

// Per-entry vote map (survives page reloads)
function loadVoteMap(): LocalVoteMap {
  return ls<LocalVoteMap>(LS_VOTES_KEY, {});
}

function persistVote(entryId: string, vote: "up" | "down" | null) {
  const m = loadVoteMap();
  if (vote === null) delete m[entryId];
  else m[entryId] = vote;
  lsSet(LS_VOTES_KEY, m);
}

// ─── Vote state ──────────────────────────────────────────────────────────────

interface VoteState {
  upvotes: number;
  downvotes: number;
  userVote: "up" | "down" | null;
  status: DictionaryEntry["status"];
}

function buildVoteMap(
  entries: DictionaryEntry[],
  stored: LocalVoteMap
): Record<string, VoteState> {
  const m: Record<string, VoteState> = {};
  for (const e of entries) {
    m[e._id] = {
      upvotes: e.upvotes ?? 0,
      downvotes: e.downvotes ?? 0,
      userVote: stored[e._id] ?? null,
      status: e.status,
    };
  }
  return m;
}

// ─── Vote buttons ────────────────────────────────────────────────────────────

function VoteButtons({
  entryId,
  voteState,
  onVote,
}: {
  entryId: string;
  voteState: VoteState;
  onVote: (id: string, dir: "up" | "down") => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function handle(dir: "up" | "down") {
    if (busy) return;
    setBusy(true);
    await onVote(entryId, dir);
    setBusy(false);
  }

  const UpIcon = voteState.userVote === "up" ? BsHandThumbsUpFill : BsHandThumbsUp;
  const DownIcon =
    voteState.userVote === "down" ? BsHandThumbsDownFill : BsHandThumbsDown;

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

      {voteState.status === "pending" && (
        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
          en attente
        </span>
      )}
    </div>
  );
}

// ─── Linguistic reference matching ───────────────────────────────────────────

function matchRefs(
  entry: DictionaryEntry,
  refs: LinguisticReference[]
): LinguisticReference[] {
  const haystack = [
    entry.soninke,
    entry.english ?? "",
    entry.french ?? "",
    entry.definition ?? "",
    entry.example ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return refs.filter((ref) => {
    if (ref.isGlobal) return true;
    return ref.triggerPatterns.some((p) =>
      p.trim() && haystack.includes(p.trim().toLowerCase())
    );
  });
}

const CATEGORY_LABEL: Record<LinguisticReference["category"], string> = {
  rule: "Règle",
  alphabet: "Alphabet",
  vocabulary: "Vocabulaire",
  grammar: "Grammaire",
  culture: "Culture",
};

const CATEGORY_COLOR: Record<LinguisticReference["category"], string> = {
  rule: "bg-blue-50 border-blue-100 text-blue-800",
  alphabet: "bg-violet-50 border-violet-100 text-violet-800",
  vocabulary: "bg-emerald-50 border-emerald-100 text-emerald-800",
  grammar: "bg-rose-50 border-rose-100 text-rose-800",
  culture: "bg-amber-50 border-amber-100 text-amber-800",
};

function LinguisticRefPanel({ refs }: { refs: LinguisticReference[] }) {
  if (refs.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Références linguistiques
      </p>
      {refs.map((ref) => (
        <div
          key={ref._id}
          className={`rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${CATEGORY_COLOR[ref.category]}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
            {CATEGORY_LABEL[ref.category]} · {ref.title}
          </p>
          <p className="whitespace-pre-line text-xs opacity-90">{ref.body}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Audio play button ────────────────────────────────────────────────────────

function AudioButton({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center justify-center h-7 w-7 rounded-full transition active:scale-90 ${
        playing
          ? "bg-amber-600 text-white"
          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
      }`}
      aria-label={playing ? "Arrêter" : "Écouter la prononciation"}
      title={playing ? "Arrêter" : "Écouter la prononciation"}
    >
      {playing ? (
        <BsStopFill className="text-xs" />
      ) : (
        <BsVolumeUpFill className="text-sm" />
      )}
    </button>
  );
}

// ─── Dictionary card ─────────────────────────────────────────────────────────

function DictionaryCard({
  entry,
  voteState,
  onVote,
  matchedRefs,
}: {
  entry: DictionaryEntry;
  voteState: VoteState;
  onVote: (id: string, dir: "up" | "down") => Promise<void>;
  matchedRefs: LinguisticReference[];
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore =
    entry.definition || entry.example || entry.kemetRapprochement || matchedRefs.length > 0;
  const isPending = entry.status === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`glass rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] ${
          voteState.status === "flagged"
            ? "!bg-orange-50/50 !border-orange-200/60"
            : isPending
            ? "!bg-amber-50/50 !border-amber-200/50"
            : ""
        }`}
      >
        <button
          type="button"
          onClick={() => hasMore && setExpanded((v) => !v)}
          className={`w-full text-left p-4 pb-2 ${
            hasMore ? "cursor-pointer" : "cursor-default"
          }`}
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
                    {labelOf(entry.partOfSpeech)}
                  </Badge>
                )}
                {entry.wordType && entry.wordType !== "WORD" && (
                  <Badge tone="default" className="text-[10px]">
                    {labelOf(entry.wordType)}
                  </Badge>
                )}
                {entry.dialect && entry.dialect !== "UNKNOWN" && (
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">
                    {entry.dialect}
                  </span>
                )}
              </div>
              {/* Translations — show whichever fields are present */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                {entry.english && (
                  <span className="flex items-center gap-1.5">
                    <BsArrowRight className="text-amber-500 flex-shrink-0 text-sm" />
                    <span className="text-sm font-semibold text-amber-700">
                      {entry.english}
                    </span>
                  </span>
                )}
                {entry.french && (
                  <span className="flex items-center gap-1.5">
                    {!entry.english && (
                      <BsArrowRight className="text-blue-400 flex-shrink-0 text-sm" />
                    )}
                    <span className="text-sm font-semibold text-blue-600">
                      {entry.french}
                    </span>
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">fr</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              {entry.audioUrl && (
                <AudioButton url={entry.audioUrl} />
              )}
              {hasMore && (
                <span className="text-xs text-gray-400 select-none">
                  {expanded ? "moins" : "plus"}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Vote bar — disabled for pending entries */}
        <div className="px-4 pb-3">
          {isPending ? (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              ⏳ en attente de validation
            </span>
          ) : (
            <VoteButtons
              entryId={entry._id}
              voteState={voteState}
              onVote={onVote}
            />
          )}
        </div>

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
                {entry.semanticCategories && entry.semanticCategories.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Catégories sémantiques
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.semanticCategories.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] font-semibold rounded-full bg-amber-100/80 text-amber-800 px-2.5 py-0.5"
                        >
                          {labelOf(c)}
                        </span>
                      ))}
                    </div>
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

                <LinguisticRefPanel refs={matchedRefs} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Reusable form primitives ─────────────────────────────────────────────────

const selectCls =
  "w-full rounded-xl border border-amber-100 bg-white px-3 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pt-1">
      {children}
    </p>
  );
}

// Searchable multi-select with removable chips
function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Rechercher…",
}: {
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (o) =>
      o.toLowerCase().includes(q.toLowerCase()) &&
      !selected.includes(o)
  );

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  function add(v: string) {
    onChange([...selected, v]);
    setQ("");
  }

  function remove(v: string) {
    onChange(selected.filter((s) => s !== v));
  }

  return (
    <div ref={containerRef} className="space-y-1.5">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => remove(s)}
              className="flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold px-2.5 py-1 hover:bg-amber-200 transition"
            >
              {labelOf(s)}
              <IoClose className="text-xs" />
            </button>
          ))}
        </div>
      )}
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? placeholder : "Ajouter…"}
          className="w-full rounded-xl border border-amber-100 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60 placeholder:text-gray-400"
        />
        {/* Dropdown */}
        <AnimatePresence>
          {open && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-2xl bg-white border border-amber-100 shadow-xl shadow-amber-100/40 py-1"
            >
              {filtered.map((o) => (
                <button
                  key={o}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); add(o); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition"
                >
                  {labelOf(o)}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {selected.length === 0 && (
        <p className="text-[11px] text-gray-400">Tapez pour rechercher et sélectionner plusieurs catégories.</p>
      )}
    </div>
  );
}

// ─── Voice recorder ──────────────────────────────────────────────────────────

type RecordState = "idle" | "recording" | "recorded";

function VoiceRecorder({
  onBlob,
  uploading = false,
  uploadDone = false,
}: {
  onBlob: (blob: Blob | null) => void;
  uploading?: boolean;
  uploadDone?: boolean;
}) {
  const [state, setState] = useState<RecordState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start(100);
      recorderRef.current = recorder;
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      setState("recording");
    } catch {
      alert("Impossible d'accéder au microphone. Vérifiez les permissions.");
    }
  }

  function stop() {
    clearTimer();
    recorderRef.current?.stop();
    setState("recorded");
  }

  function reset() {
    clearTimer();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setElapsed(0);
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onBlob(null);
    setState("idle");
  }

  useEffect(() => () => { clearTimer(); if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3 space-y-2">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        Note vocale (optionnel)
      </p>

      {state === "idle" && (
        <button
          type="button"
          onClick={start}
          className="flex items-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-amber-700 active:scale-95 transition"
        >
          <BsMicFill />
          Enregistrer la prononciation
        </button>
      )}

      {state === "recording" && (
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-red-600 tabular-nums">
            {fmt(elapsed)}
          </span>
          <button
            type="button"
            onClick={stop}
            className="flex items-center gap-2 rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 active:scale-95 transition"
          >
            <BsStopFill />
            Arrêter
          </button>
        </div>
      )}

      {state === "recorded" && previewUrl && (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden">
            <audio
              src={previewUrl}
              controls
              className={`w-full h-10 rounded-xl transition-opacity ${uploading ? "opacity-40" : ""}`}
            />
            {/* Upload progress overlay */}
            <AnimatePresence>
              {(uploading || uploadDone) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold ${
                    uploadDone
                      ? "bg-green-500/20 text-green-700"
                      : "bg-amber-500/20 text-amber-800"
                  }`}
                >
                  {uploadDone ? (
                    <>
                      <BsCheckCircleFill className="text-green-600" />
                      Note vocale enregistrée
                    </>
                  ) : (
                    <>
                      <Spinner className="text-amber-600" />
                      Envoi en cours…
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={reset}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <BsArrowClockwise />
            Recommencer
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Chip selector (single-select pill grid) ─────────────────────────────────

function ChipSelector({
  options,
  value,
  onChange,
  cols = 3,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  cols?: 2 | 3 | 4;
}) {
  const grid = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[cols];
  return (
    <div className={`grid ${grid} gap-2`}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(value === o ? "" : o)}
          className={`rounded-2xl py-2.5 px-2 text-xs font-semibold text-center transition-all active:scale-95 ${
            value === o
              ? "bg-amber-500 text-white shadow-md shadow-amber-200"
              : "bg-white/60 text-gray-600 border border-gray-200/80 hover:border-amber-300 hover:text-amber-700"
          }`}
        >
          {labelOf(o)}
        </button>
      ))}
    </div>
  );
}

// ─── Add word stepper sheet ───────────────────────────────────────────────────

const STEPS = [
  { id: "word",       label: "Mot"           },
  { id: "grammar",    label: "Grammaire"     },
  { id: "type",       label: "Type"          },
  { id: "semantic",   label: "Sémantique"    },
  { id: "content",    label: "Contenu"       },
  { id: "audio",      label: "Prononciation" },
  { id: "submit",     label: "Soumettre"     },
] as const;

function AddWordSheet({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (entry: DictionaryEntry) => void;
}) {
  // Step navigation
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1); // 1=forward, -1=back

  // Upload/submit state
  const [busy, setBusy] = useState(false);
  const [uploadStep, setUploadStep] = useState<"idle"|"uploading-audio"|"audio-done"|"saving-word">("idle");
  const [error, setError] = useState("");
  const [audioWarning, setAudioWarning] = useState("");

  // Controlled form values (needed for sticky header live preview)
  const [soninke, setSoninke]       = useState("");
  const [english, setEnglish]       = useState("");
  const [french, setFrench]         = useState("");
  const [phonetic, setPhonetic]     = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [wordType, setWordType]     = useState("");
  const [dialect, setDialect]       = useState("");
  const [semanticCategories, setSemanticCategories] = useState<string[]>([]);
  const [definition, setDefinition] = useState("");
  const [example, setExample]       = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const audioBlobRef = useRef<Blob | null>(null);

  const uploadingAudio = uploadStep === "uploading-audio";
  const audioDone      = uploadStep === "audio-done" || uploadStep === "saving-word";

  function go(next: number) {
    setDir(next > slide ? 1 : -1);
    setSlide(next);
    setError("");
  }

  function canNext(): string | null {
    if (slide === 0) {
      if (!soninke.trim()) return "Le mot Soninké est requis.";
      if (!english.trim() && !french.trim()) return "Au moins une traduction (anglais ou français) est requise.";
    }
    return null;
  }

  async function handleSubmit() {
    setError("");
    setAudioWarning("");
    setBusy(true);

    let audioUrl: string | undefined;
    if (audioBlobRef.current) {
      setUploadStep("uploading-audio");
      try {
        const res = await fetch("/api/upload-audio", {
          method: "POST",
          headers: { "Content-Type": audioBlobRef.current.type || "audio/webm" },
          body: audioBlobRef.current,
        });
        const json = await res.json();
        if (json.ok) {
          audioUrl = json.data.url;
          setUploadStep("audio-done");
          await new Promise((r) => setTimeout(r, 600));
        } else {
          setAudioWarning(`Note vocale non sauvegardée : ${json.error || "erreur serveur"}`);
        }
      } catch {
        setAudioWarning("Note vocale non sauvegardée : erreur réseau.");
      }
    }
    setUploadStep("saving-word");

    try {
      const res = await fetch("/api/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soninke: soninke.trim(),
          english: english.trim() || undefined,
          french: french.trim() || undefined,
          phonetic: phonetic.trim() || undefined,
          partOfSpeech: partOfSpeech || undefined,
          wordType: wordType || undefined,
          dialect: dialect || undefined,
          semanticCategories: semanticCategories.length > 0 ? semanticCategories : undefined,
          definition: definition.trim() || undefined,
          example: example.trim() || undefined,
          submittedBy: submittedBy.trim() || undefined,
          audioUrl,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Erreur");
      onSuccess(json.data as DictionaryEntry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setBusy(false);
      setUploadStep("idle");
    }
  }

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? "100%" : "-100%", opacity: 0 }),
  };

  // ── Sticky header meta tags ───────────────────────────────────────────────
  const metaTags = [
    partOfSpeech && labelOf(partOfSpeech),
    semanticCategories[0] && labelOf(semanticCategories[0]),
    dialect && dialect !== "UNKNOWN" && dialect,
  ].filter(Boolean) as string[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
    >
      {/* Backdrop */}
      <motion.button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"
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
        transition={{ type: "spring", damping: 32, stiffness: 360 }}
        className="relative w-full max-w-md bg-white rounded-t-[2rem] shadow-2xl h-[92dvh] flex flex-col overflow-hidden"
      >
        {/* ── Drag handle ────────────────────────────────────────────────── */}
        <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* ── Step progress dots ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-2 pb-1 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === slide
                    ? "w-5 h-2 bg-amber-500"
                    : i < slide
                    ? "w-2 h-2 bg-amber-300"
                    : "w-2 h-2 bg-gray-200"
                }`}
              />
            ))}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 transition">
            <IoClose className="text-lg text-gray-400" />
          </button>
        </div>

        {/* ── STICKY HEADER — word always visible ─────────────────────────── */}
        <div className="px-5 py-3 border-b border-gray-100/80 flex-shrink-0 bg-white">
          <p className={`font-black tracking-tight leading-none transition-all duration-200 ${
            soninke ? "text-3xl text-gray-900" : "text-2xl text-gray-300"
          }`}>
            {soninke || "Soninké…"}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap min-h-[20px]">
            {metaTags.length === 0 ? (
              <span className="text-xs text-gray-300">catégorie · région</span>
            ) : (
              metaTags.map((t, i) => (
                <span key={t}>
                  {i > 0 && <span className="text-gray-300 text-xs mr-1.5">·</span>}
                  <span className="text-xs font-semibold text-amber-600 lowercase">{t}</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* ── Slide content ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence custom={dir} mode="wait">
            <motion.div
              key={slide}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 overflow-y-auto px-5 py-5 space-y-5"
            >
              {/* STEP 0 — Mot & Traductions */}
              {slide === 0 && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xl font-bold text-gray-900 mb-1">Quel est le mot ?</p>
                    <p className="text-sm text-gray-400">Entrez le mot en Soninké avec au moins une traduction.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      Mot Soninké <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={soninke}
                      onChange={(e) => setSoninke(e.target.value)}
                      placeholder="ex: naaxu"
                      autoFocus
                      className="w-full rounded-2xl border border-amber-100 bg-white px-4 py-4 text-2xl font-bold text-gray-900 shadow-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/60 placeholder:text-gray-200 placeholder:font-normal placeholder:text-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Anglais</label>
                      <Input value={english} onChange={(e) => setEnglish(e.target.value)} placeholder="ex: cow" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Français</label>
                      <Input value={french} onChange={(e) => setFrench(e.target.value)} placeholder="ex: vache" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Phonétique</label>
                    <Input value={phonetic} onChange={(e) => setPhonetic(e.target.value)} placeholder="ex: naː-xu" />
                  </div>
                </div>
              )}

              {/* STEP 1 — Catégorie grammaticale */}
              {slide === 1 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xl font-bold text-gray-900 mb-1">Catégorie grammaticale</p>
                    <p className="text-sm text-gray-400">Quelle est la nature de ce mot ?</p>
                  </div>
                  <ChipSelector options={PARTS_OF_SPEECH} value={partOfSpeech} onChange={setPartOfSpeech} cols={3} />
                </div>
              )}

              {/* STEP 2 — Type & Dialecte */}
              {slide === 2 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xl font-bold text-gray-900 mb-1">Type d&apos;entrée</p>
                    <p className="text-sm text-gray-400">S&apos;agit-il d&apos;un mot simple, d&apos;un proverbe, d&apos;une expression ?</p>
                  </div>
                  <ChipSelector options={WORD_TYPES} value={wordType} onChange={setWordType} cols={2} />

                  <div>
                    <p className="text-base font-bold text-gray-900 mb-1 mt-2">Région / Dialecte</p>
                    <p className="text-sm text-gray-400 mb-3">Dans quelle région ce mot est-il utilisé ?</p>
                    <ChipSelector options={DIALECTS} value={dialect} onChange={setDialect} cols={3} />
                  </div>
                </div>
              )}

              {/* STEP 3 — Catégories sémantiques */}
              {slide === 3 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xl font-bold text-gray-900 mb-1">Catégories sémantiques</p>
                    <p className="text-sm text-gray-400">Sélectionnez tous les domaines liés à ce mot. Plus vous en ajoutez, plus le corpus est riche.</p>
                  </div>
                  <MultiSelect
                    options={SEMANTIC_CATEGORIES}
                    selected={semanticCategories}
                    onChange={setSemanticCategories}
                    placeholder="Rechercher… FAMILY, ANIMALS, TIME…"
                  />
                </div>
              )}

              {/* STEP 4 — Définition & Exemple */}
              {slide === 4 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xl font-bold text-gray-900 mb-1">Définition & Exemple</p>
                    <p className="text-sm text-gray-400">Décrivez le sens du mot et donnez un exemple d&apos;utilisation.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Définition</label>
                    <TextArea
                      value={definition}
                      onChange={(e) => setDefinition(e.target.value)}
                      placeholder="Décrivez le sens…"
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Exemple</label>
                    <Input value={example} onChange={(e) => setExample(e.target.value)} placeholder="ex: Naaxu xa dafe baane." />
                  </div>
                </div>
              )}

              {/* STEP 5 — Prononciation */}
              {slide === 5 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xl font-bold text-gray-900 mb-1">Prononciation</p>
                    <p className="text-sm text-gray-400">Enregistrez votre voix pour archiver la prononciation du mot.</p>
                  </div>
                  <VoiceRecorder
                    onBlob={(b) => { audioBlobRef.current = b; }}
                    uploading={uploadingAudio}
                    uploadDone={audioDone}
                  />
                </div>
              )}

              {/* STEP 6 — Récap & Soumettre */}
              {slide === 6 && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xl font-bold text-gray-900 mb-1">Prêt à soumettre ?</p>
                    <p className="text-sm text-gray-400">Votre contribution sera validée par un administrateur avant d&apos;apparaître dans le dictionnaire.</p>
                  </div>

                  {/* Summary card */}
                  <div className="glass rounded-2xl p-4 space-y-2 text-sm">
                    <Row label="Soninké"    value={soninke} />
                    {english && <Row label="Anglais"    value={english} />}
                    {french  && <Row label="Français"   value={french} />}
                    {phonetic && <Row label="Phonétique" value={`/${phonetic}/`} />}
                    {partOfSpeech && <Row label="Grammaire"  value={labelOf(partOfSpeech)} />}
                    {wordType && <Row label="Type"       value={labelOf(wordType)} />}
                    {dialect  && <Row label="Région"     value={dialect} />}
                    {semanticCategories.length > 0 && (
                      <Row label="Sémantique" value={semanticCategories.map(labelOf).join(", ")} />
                    )}
                    {definition && <Row label="Définition" value={definition} />}
                    {example && <Row label="Exemple"    value={`"${example}"`} />}
                    {audioBlobRef.current && <Row label="Audio" value="✓ enregistrement joint" />}
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
                  )}
                  {audioWarning && (
                    <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">⚠️ {audioWarning}</p>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Votre nom (optionnel)</label>
                    <Input value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} placeholder="ex: Moussa Kouyaté" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Navigation bar — pb-20 clears the fixed BottomNav ──────────── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-20 border-t border-gray-100/80 bg-white flex items-center gap-3">
          {slide > 0 ? (
            <button
              type="button"
              onClick={() => go(slide - 1)}
              disabled={busy}
              className="flex items-center justify-center h-12 w-12 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition flex-shrink-0"
            >
              <BsArrowRight className="rotate-180 text-lg" />
            </button>
          ) : (
            <div className="w-12" />
          )}

          {slide < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                const err = canNext();
                if (err) { setError(err); return; }
                go(slide + 1);
              }}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 active:scale-[0.99] transition shadow-md shadow-amber-200"
            >
              {STEPS[slide + 1].label}
              <BsArrowRight className="text-base" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 active:scale-[0.99] transition disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Spinner size="md" className="text-white" />
                  {uploadStep === "uploading-audio" ? "Audio…" :
                   uploadStep === "audio-done"      ? "Audio ✓" :
                   uploadStep === "saving-word"     ? "Envoi…" : "Envoi…"}
                </>
              ) : (
                <>
                  <BsCheckCircleFill />
                  Soumettre
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-24 flex-shrink-0 text-xs font-semibold uppercase tracking-wide pt-0.5">{label}</span>
      <span className="text-gray-700 flex-1 text-sm leading-snug">{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DictionaryClient({
  initialEntries,
  linguisticRefs = [],
}: {
  initialEntries: DictionaryEntry[];
  linguisticRefs?: LinguisticReference[];
}) {
  // Merge server-approved entries with any locally-saved pending submissions.
  // This runs only on the client (typeof window guard inside ls()).
  const [entries, setEntries] = useState<DictionaryEntry[]>(() => {
    const approvedIds = new Set(initialEntries.map((e) => e._id));
    // Clean up any pending entries that have since been approved server-side
    prunePending(approvedIds);
    const pending = loadPending();
    return [...initialEntries, ...pending];
  });

  // Initialize vote map directly with localStorage data so there is no flash.
  const [voteMap, setVoteMap] = useState<Record<string, VoteState>>(() =>
    buildVoteMap(entries, loadVoteMap())
  );

  const [voterKey, setVoterKey] = useState("");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Hydrate voterKey (client-only — needs window)
  useEffect(() => {
    setVoterKey(getOrCreateVoterKey());
  }, []);

  // Cast a vote ──────────────────────────────────────────────────────────────
  const castVote = useCallback(
    async (entryId: string, dir: "up" | "down") => {
      if (!voterKey) return;
      const prev = voteMap[entryId];
      if (!prev) return;

      const toggling = prev.userVote === dir;
      const switching = prev.userVote !== null && !toggling;
      const next: VoteState = { ...prev };

      if (toggling) {
        if (dir === "up") next.upvotes = Math.max(0, prev.upvotes - 1);
        else next.downvotes = Math.max(0, prev.downvotes - 1);
        next.userVote = null;
      } else if (switching) {
        if (dir === "up") {
          next.upvotes = prev.upvotes + 1;
          next.downvotes = Math.max(0, prev.downvotes - 1);
        } else {
          next.downvotes = prev.downvotes + 1;
          next.upvotes = Math.max(0, prev.upvotes - 1);
        }
        next.userVote = dir;
      } else {
        if (dir === "up") next.upvotes = prev.upvotes + 1;
        else next.downvotes = prev.downvotes + 1;
        next.userVote = dir;
      }

      // Optimistic update
      setVoteMap((m) => ({ ...m, [entryId]: next }));
      persistVote(entryId, next.userVote);

      try {
        const res = await fetch("/api/dictionary/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId, vote: dir, voterKey }),
        });
        const json = await res.json();
        if (json.ok) {
          // Reconcile with server truth
          const confirmed: VoteState = {
            upvotes: json.data.upvotes,
            downvotes: json.data.downvotes,
            userVote: json.data.userVote,
            status: json.data.status,
          };
          setVoteMap((m) => ({ ...m, [entryId]: confirmed }));
          persistVote(entryId, confirmed.userVote);
        } else {
          // Revert on error
          setVoteMap((m) => ({ ...m, [entryId]: prev }));
          persistVote(entryId, prev.userVote);
        }
      } catch {
        setVoteMap((m) => ({ ...m, [entryId]: prev }));
        persistVote(entryId, prev.userVote);
      }
    },
    [voterKey, voteMap]
  );

  // Handle new word submission ──────────────────────────────────────────────
  function handleAddSuccess(entry: DictionaryEntry) {
    setShowAdd(false);
    setSubmitted(true);
    // Persist to localStorage so it survives page reloads
    savePending(entry);
    setEntries((prev) => {
      if (prev.find((e) => e._id === entry._id)) return prev;
      return [entry, ...prev];
    });
    setVoteMap((m) => ({
      ...m,
      [entry._id]: {
        upvotes: 0,
        downvotes: 0,
        userVote: null,
        status: "pending",
      },
    }));
    setTimeout(() => setSubmitted(false), 6000);
  }

  // Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.soninke.toLowerCase().includes(q) ||
        e.english?.toLowerCase().includes(q) ||
        e.french?.toLowerCase().includes(q) ||
        e.definition?.toLowerCase().includes(q)
    );
  }, [entries, query]);

  const visibleCount = entries.filter(
    (e) => e.status === "approved" || e.status === "flagged"
  ).length;
  const pendingCount = entries.filter((e) => e.status === "pending").length;

  return (
    <>
      {/* Search + Add ─────────────────────────────────────────────────────── */}
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

      {/* Submission toast ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800"
          >
            Merci ! Votre mot a été soumis. Il apparaît ci-dessous en attente de validation.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Counts ──────────────────────────────────────────────────────────── */}
      {!query && (visibleCount > 0 || pendingCount > 0) && (
        <p className="text-xs text-gray-400 px-1">
          {visibleCount > 0
            ? `${visibleCount} mot${visibleCount !== 1 ? "s" : ""} dans le dictionnaire`
            : ""}
          {visibleCount > 0 && pendingCount > 0 ? " · " : ""}
          {pendingCount > 0
            ? `${pendingCount} en attente de validation`
            : ""}
        </p>
      )}
      {query && (
        <p className="text-xs text-gray-400 px-1">
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} pour{" "}
          &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Word list ───────────────────────────────────────────────────────── */}
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
              matchedRefs={matchRefs(entry, linguisticRefs)}
            />
          ))}
        </div>
      )}

      {/* Add word sheet ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <AddWordSheet onClose={() => setShowAdd(false)} onSuccess={handleAddSuccess} />
        )}
      </AnimatePresence>
    </>
  );
}
