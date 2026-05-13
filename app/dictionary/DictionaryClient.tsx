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

// ─── Add word bottom sheet ────────────────────────────────────────────────────

function AddWordSheet({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (entry: DictionaryEntry) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"idle" | "uploading-audio" | "audio-done" | "saving-word">("idle");
  const [error, setError] = useState("");
  const [audioWarning, setAudioWarning] = useState("");
  const [semanticCategories, setSemanticCategories] = useState<string[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);

  const uploadingAudio = step === "uploading-audio";
  const audioDone = step === "audio-done" || step === "saving-word";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setAudioWarning("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);

    let audioUrl: string | undefined;
    if (audioBlobRef.current) {
      setStep("uploading-audio");
      try {
        const res = await fetch("/api/upload-audio", {
          method: "POST",
          headers: { "Content-Type": audioBlobRef.current.type || "audio/webm" },
          body: audioBlobRef.current,
        });
        const json = await res.json();
        if (json.ok) {
          audioUrl = json.data.url;
          setStep("audio-done");
          await new Promise((r) => setTimeout(r, 600));
        } else {
          setAudioWarning(`Note vocale non sauvegardée : ${json.error || "erreur serveur"}`);
          setStep("idle");
        }
      } catch {
        setAudioWarning("Note vocale non sauvegardée : erreur réseau.");
        setStep("idle");
      }
    }
    setStep("saving-word");

    const payload = {
      soninke: String(fd.get("soninke") || "").trim(),
      english: String(fd.get("english") || "").trim() || undefined,
      french: String(fd.get("french") || "").trim() || undefined,
      phonetic: String(fd.get("phonetic") || "").trim() || undefined,
      partOfSpeech: String(fd.get("partOfSpeech") || "").trim() || undefined,
      wordType: String(fd.get("wordType") || "").trim() || undefined,
      dialect: String(fd.get("dialect") || "").trim() || undefined,
      semanticCategories: semanticCategories.length > 0 ? semanticCategories : undefined,
      definition: String(fd.get("definition") || "").trim() || undefined,
      example: String(fd.get("example") || "").trim() || undefined,
      submittedBy: String(fd.get("submittedBy") || "").trim() || undefined,
      audioUrl,
    };
    if (!payload.soninke) {
      setError("Le mot Soninké est requis.");
      setBusy(false);
      setStep("idle");
      return;
    }
    if (!payload.english && !payload.french) {
      setError("Au moins une traduction (anglais ou français) est requise.");
      setBusy(false);
      setStep("idle");
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
      setStep("idle");
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
        <div className="flex items-center justify-between px-5 pb-2 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Proposer un mot</h2>
            <p className="text-xs text-gray-500 mt-0.5">Validé par un administrateur avant publication.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition">
            <IoClose className="text-xl text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 pb-8 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}
          {audioWarning && (
            <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">⚠️ {audioWarning}</p>
          )}

          {/* ── SECTION 1: Traductions ─────────────────────────────────── */}
          <SectionLabel>Traductions</SectionLabel>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Mot Soninké <span className="text-red-400">*</span>
            </label>
            <Input name="soninke" placeholder="ex: naaxu" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Anglais</label>
              <Input name="english" placeholder="ex: cow" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Français</label>
              <Input name="french" placeholder="ex: vache" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 -mt-2">Au moins une traduction est requise.</p>

          {/* ── SECTION 2: Métadonnées linguistiques ───────────────────── */}
          <SectionLabel>Métadonnées linguistiques</SectionLabel>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Catégorie grammaticale
              </label>
              <select name="partOfSpeech" className={selectCls}>
                <option value="">— sélectionner —</option>
                {PARTS_OF_SPEECH.map((p) => (
                  <option key={p} value={p}>{labelOf(p)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Type d&apos;entrée
              </label>
              <select name="wordType" className={selectCls}>
                <option value="">— sélectionner —</option>
                {WORD_TYPES.map((t) => (
                  <option key={t} value={t}>{labelOf(t)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Dialecte / Région
              </label>
              <select name="dialect" className={selectCls}>
                <option value="">— sélectionner —</option>
                {DIALECTS.map((d) => (
                  <option key={d} value={d}>{labelOf(d)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Phonétique
              </label>
              <Input name="phonetic" placeholder="ex: naː-xu" />
            </div>
          </div>

          {/* ── SECTION 3: Catégories sémantiques ─────────────────────── */}
          <SectionLabel>Catégories sémantiques</SectionLabel>
          <MultiSelect
            options={SEMANTIC_CATEGORIES}
            selected={semanticCategories}
            onChange={setSemanticCategories}
            placeholder="Rechercher une catégorie… (FAMILY, ANIMALS…)"
          />

          {/* ── SECTION 4: Contenu ────────────────────────────────────── */}
          <SectionLabel>Contenu</SectionLabel>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Définition</label>
            <TextArea name="definition" placeholder="Décrivez le sens du mot…" className="min-h-[72px]" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Exemple d&apos;utilisation</label>
            <Input name="example" placeholder="ex: Naaxu xa dafe baane." />
          </div>

          {/* ── SECTION 5: Prononciation ──────────────────────────────── */}
          <SectionLabel>Prononciation</SectionLabel>
          <VoiceRecorder
            onBlob={(b) => { audioBlobRef.current = b; }}
            uploading={uploadingAudio}
            uploadDone={audioDone}
          />

          {/* ── SECTION 6: Contributeur ───────────────────────────────── */}
          <SectionLabel>Contributeur</SectionLabel>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Votre nom (optionnel)</label>
            <Input name="submittedBy" placeholder="ex: Moussa Kouyaté" />
          </div>
          {busy ? (
            <div className="space-y-2 mt-2">
              {/* Progress strip */}
              <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
                {/* Step 1 */}
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                  step === "uploading-audio" ? "text-amber-700" :
                  audioDone ? "text-green-600" : "text-gray-300"
                }`}>
                  {step === "uploading-audio" ? (
                    <Spinner className="text-amber-600" />
                  ) : audioDone ? (
                    <BsCheckCircleFill />
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-current flex-shrink-0" />
                  )}
                  Note vocale
                </div>

                {/* connector */}
                <div className={`flex-1 h-0.5 rounded-full transition-colors ${audioDone ? "bg-green-300" : "bg-gray-200"}`} />

                {/* Step 2 */}
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                  step === "saving-word" ? "text-amber-700" : "text-gray-300"
                }`}>
                  {step === "saving-word" ? (
                    <Spinner className="text-amber-600" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-current flex-shrink-0" />
                  )}
                  Enregistrement
                </div>
              </div>

              <button
                type="button"
                disabled
                className="w-full rounded-2xl bg-amber-200 text-amber-700 py-3 text-sm font-semibold opacity-80 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Spinner size="md" className="text-amber-600" />
                {step === "uploading-audio" ? "Envoi de la note vocale…" :
                 step === "audio-done" ? "Note vocale enregistrée ✓" :
                 "Enregistrement du mot…"}
              </button>
            </div>
          ) : (
            <Button type="submit" className="w-full mt-2">
              Soumettre le mot
            </Button>
          )}
        </form>
      </motion.div>
    </motion.div>
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
