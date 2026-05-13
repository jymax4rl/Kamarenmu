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
  BsPlayFill,
  BsArrowClockwise,
  BsVolumeUpFill,
} from "react-icons/bs";
import type { DictionaryEntry, LinguisticReference } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const POS_OPTIONS = [
  "noun", "verb", "adjective", "adverb", "phrase", "expression", "other",
];

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
    entry.english,
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={`rounded-2xl overflow-hidden ${
          voteState.status === "flagged"
            ? "border-orange-200/80"
            : isPending
            ? "border-amber-200/60 bg-amber-50/30"
            : "border-amber-100/80"
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
                    {entry.partOfSpeech}
                  </Badge>
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
      </Card>
    </motion.div>
  );
}

// ─── Voice recorder ──────────────────────────────────────────────────────────

type RecordState = "idle" | "recording" | "recorded";

function VoiceRecorder({
  onBlob,
}: {
  onBlob: (blob: Blob | null) => void;
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
          <audio
            src={previewUrl}
            controls
            className="w-full h-10 rounded-xl"
          />
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition"
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
  const [busyLabel, setBusyLabel] = useState("");
  const [error, setError] = useState("");
  const [audioWarning, setAudioWarning] = useState("");
  const audioBlobRef = useRef<Blob | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setAudioWarning("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);

    // Upload audio first (if recorded)
    let audioUrl: string | undefined;
    if (audioBlobRef.current) {
      setBusyLabel("Envoi de la note vocale…");
      try {
        const res = await fetch("/api/upload-audio", {
          method: "POST",
          headers: { "Content-Type": audioBlobRef.current.type || "audio/webm" },
          body: audioBlobRef.current,
        });
        const json = await res.json();
        if (json.ok) {
          audioUrl = json.data.url;
        } else {
          setAudioWarning(`Note vocale non sauvegardée : ${json.error || "erreur serveur"}`);
        }
      } catch {
        setAudioWarning("Note vocale non sauvegardée : erreur réseau.");
      }
    }
    setBusyLabel("Envoi du mot…");

    const payload = {
      soninke: String(fd.get("soninke") || "").trim(),
      english: String(fd.get("english") || "").trim() || undefined,
      french: String(fd.get("french") || "").trim() || undefined,
      phonetic: String(fd.get("phonetic") || "").trim() || undefined,
      partOfSpeech: String(fd.get("partOfSpeech") || "").trim() || undefined,
      definition: String(fd.get("definition") || "").trim() || undefined,
      example: String(fd.get("example") || "").trim() || undefined,
      submittedBy: String(fd.get("submittedBy") || "").trim() || undefined,
      audioUrl,
    };
    if (!payload.soninke) {
      setError("Le mot Soninké est requis.");
      setBusy(false);
      return;
    }
    if (!payload.english && !payload.french) {
      setError("Au moins une traduction (anglais ou français) est requise.");
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
      setBusyLabel("");
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
          {audioWarning && (
            <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
              ⚠️ {audioWarning}
            </p>
          )}
          {/* Soninke word */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Mot Soninké <span className="text-red-400">*</span>
            </label>
            <Input name="soninke" placeholder="ex: naaxu" required />
          </div>

          {/* Translations row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Anglais
              </label>
              <Input name="english" placeholder="ex: cow" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Français
              </label>
              <Input name="french" placeholder="ex: vache" />
            </div>
          </div>

          <p className="text-[11px] text-gray-400 -mt-1">
            Au moins une traduction est requise.
          </p>

          {/* Phonetic + POS */}
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

          {/* Voice recorder */}
          <VoiceRecorder onBlob={(b) => { audioBlobRef.current = b; }} />
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
            {busy ? (busyLabel || "Envoi…") : "Soumettre le mot"}
          </Button>
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
        e.english.toLowerCase().includes(q) ||
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
