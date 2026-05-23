// ============================================================
// FILE: src/features/interface/views/sourceSeperation/pages/SourceSeparation.page.jsx
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import {
  Scissors,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Play,
  Pause,
  Download,
  Mic2,
  Drum,
  Music2,
  Layers,
} from "lucide-react";

import HeadersSection from "../../../components/HeadersSection";
import { useAudioSeparation } from "../hooks/useAudioSeparation";

// ─── stem order + metadata ────────────────────────────────────
const STEM_ORDER = ["vocals", "drums", "bass", "other"];

const STEM_META = {
  vocals: {
    label: "Vocals",
    icon: Mic2,
    gradient: "from-pink-500 to-rose-400",
    ring: "ring-pink-500/30",
    glow: "shadow-pink-500/20",
    bar: "bg-gradient-to-r from-pink-500 to-rose-400",
    barColor: "bg-pink-400",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-400",
  },
  drums: {
    label: "Drums",
    icon: Drum,
    gradient: "from-yellow-400 to-orange-400",
    ring: "ring-yellow-400/30",
    glow: "shadow-yellow-400/20",
    bar: "bg-gradient-to-r from-yellow-400 to-orange-400",
    barColor: "bg-yellow-400",
    iconBg: "bg-yellow-400/10",
    iconColor: "text-yellow-400",
  },
  bass: {
    label: "Bass",
    icon: Music2,
    gradient: "from-cyan-400 to-blue-500",
    ring: "ring-cyan-400/30",
    glow: "shadow-cyan-400/20",
    bar: "bg-gradient-to-r from-cyan-400 to-blue-500",
    barColor: "bg-cyan-400",
    iconBg: "bg-cyan-400/10",
    iconColor: "text-cyan-400",
  },
  other: {
    label: "Other",
    icon: Layers,
    gradient: "from-violet-400 to-purple-500",
    ring: "ring-violet-400/30",
    glow: "shadow-violet-400/20",
    bar: "bg-gradient-to-r from-violet-400 to-purple-500",
    barColor: "bg-violet-400",
    iconBg: "bg-violet-400/10",
    iconColor: "text-violet-400",
  },
};

// ─── Mini waveform bars ───────────────────────────────────────
function WaveBars({ stemKey, playing }) {
  const meta = STEM_META[stemKey] || STEM_META.other;
  return (
    <div className="flex items-end gap-[2px] h-6">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className={`w-[2px] rounded-full ${meta.barColor} transition-all`}
          style={{
            height: `${Math.sin(i * 0.7) * 40 + 50}%`,
            opacity: playing ? 0.9 : 0.4,
            animation: playing
              ? `barDance ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

// ─── Stem Card ───────────────────────────────────────────────
function StemCard({ stemKey, stem, animationDelay = 0 }) {
  const meta = STEM_META[stemKey] || STEM_META.other;
  const Icon = meta.icon;

  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);       // object URL so auth-protected audio works
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Fetch audio as a blob so the browser never makes a bare media request.
  // This sidesteps ERR_BLOCKED_BY_ORB (wrong Content-Type on direct <audio src>)
  // and also handles auth-protected URLs that need an Authorization header.
  useEffect(() => {
    if (!stem?.file_url) return;
    let revoked = false;

    fetch(stem.file_url)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error("[StemCard] Supabase 400 body:", body, "\nURL:", stem.file_url);
          throw new Error(`${res.status} ${res.statusText}`);
        }
        // Force audio MIME so createObjectURL works regardless of server Content-Type
        return res.blob().then((blob) => {
          const mime = blob.type.startsWith("audio/") ? blob.type : "audio/mpeg";
          return new Blob([blob], { type: mime });
        });
      })
      .then((blob) => {
        if (revoked) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.load();
        }
        setAudioReady(true);
      })
      .catch((err) => {
        if (!revoked) setLoadError(true);
        console.error("[StemCard] audio fetch failed:", stem.file_url, err);
      });

    return () => {
      revoked = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
        if (audioRef.current) audioRef.current.src = "";
      }
    };
  }, [stem?.file_url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioReady) return;
    playing ? audio.pause() : audio.play();
    setPlaying(!playing);
  };

  const handleSeek = (e) => {
    const a = audioRef.current;
    if (!a) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const handleDownload = async () => {
    if (!stem?.file_url) return;
    setDownloading(true);
    try {
      const res = await fetch(stem.file_url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = stem.file_name || `${stemKey}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className={`
        rounded-3xl border border-white/10 bg-white/5 p-5
        ring-1 ${meta.ring} shadow-lg ${meta.glow}
        transition-all duration-300 hover:bg-white/8 hover:border-white/20
      `}
      style={{ animation: `fadeSlideIn 0.4s ease ${animationDelay}ms both` }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (!a) return;
          setCurrentTime(a.currentTime);
          setProgress((a.currentTime / a.duration) * 100 || 0);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${meta.iconBg}`}>
            <Icon className={`h-5 w-5 ${meta.iconColor}`} />
          </div>
          <div>
            <p className="font-semibold text-white">{meta.label}</p>
            <p className="text-xs text-zinc-500">
              {stem?.file_size
                ? `${(stem.file_size / (1024 * 1024)).toFixed(1)} MB`
                : "—"}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={!stem?.file_url || downloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5
                     text-xs text-zinc-300 hover:bg-white/10 hover:text-white
                     disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {downloading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Download className="h-3.5 w-3.5" />}
          {downloading ? "Saving…" : "Download"}
        </button>
      </div>

      {/* Waveform */}
      <div className="mb-3">
        <WaveBars stemKey={stemKey} playing={playing} />
      </div>

      {/* Seek bar */}
      <div
        className="h-1.5 rounded-full bg-zinc-800 overflow-hidden cursor-pointer mb-2"
        onClick={handleSeek}
      >
        <div
          className={`h-full ${meta.bar} transition-all duration-100`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time + Play */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 tabular-nums">
          {fmt(currentTime)} / {fmt(duration)}
        </span>
        <button
          onClick={togglePlay}
          disabled={!audioReady || loadError}
          className={`
            flex items-center justify-center w-9 h-9 rounded-full
            bg-linear-to-br ${meta.gradient}
            shadow-md disabled:opacity-30 disabled:cursor-not-allowed
            hover:scale-105 active:scale-95 transition-transform
          `}
        >
          {playing
            ? <Pause className="h-4 w-4 text-white fill-white" />
            : <Play className="h-4 w-4 text-white fill-white ml-0.5" />}
        </button>
      </div>
    </div>
  );
}

// ─── Source Audio Player ──────────────────────────────────────
function SourceAudioPlayer({ audioUrl, fileName }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    playing ? a.pause() : a.play();
    setPlaying(!playing);
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-4 w-full">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (!a) return;
          setCurrentTime(a.currentTime);
          setProgress((a.currentTime / a.duration) * 100 || 0);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => setPlaying(false)}
      />

      <button
        onClick={toggle}
        className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full
                   bg-linear-to-br from-yellow-400 to-pink-500
                   hover:scale-105 active:scale-95 transition-transform shadow-md"
      >
        {playing
          ? <Pause className="h-4 w-4 text-white fill-white" />
          : <Play className="h-4 w-4 text-white fill-white ml-0.5" />}
      </button>

      <div className="flex-1">
        <p className="text-sm text-white truncate mb-1.5">
          {fileName || "Source Audio"}
        </p>
        <div
          className="h-1.5 rounded-full bg-zinc-800 overflow-hidden cursor-pointer"
          onClick={(e) => {
            const a = audioRef.current;
            if (!a) return;
            const r = e.currentTarget.getBoundingClientRect();
            a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
          }}
        >
          <div
            className="h-full bg-linear-to-r from-yellow-400 to-pink-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <span className="text-xs text-zinc-500 tabular-nums shrink-0">
        {fmt(currentTime)} / {fmt(duration)}
      </span>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────
const sortStems = (stemsArray) =>
  STEM_ORDER.map((key) =>
    stemsArray.find((s) => s.source_type === key)
  ).filter(Boolean);

// ─── Main Page ────────────────────────────────────────────────
export default function SourceSeparationPage() {
  const params = useParams();
  const projectId = params?.id || "";

  const project = useSelector((state) => state.interface.project);
  const reduxAudioFile = project?.data?.main_audio;

  const {
    audioFile,
    loading: audioLoading,
    error: audioError,
    fetchPrimaryAudio,
    triggerSeparation,
  } = useAudioSeparation(projectId, true);

  // ── separation state ──────────────────────────────────────
  const [status, setStatus] = useState("idle");
  const [stems, setStems] = useState([]);
  const [separationError, setSeparationError] = useState(null);
  const cleanupStreamRef = useRef(null);

  // ── check for existing stems via SSE on mount ───────────
  // We use the SSE stream (not a separate /stems fetch) so the URLs are
  // always built by the same backend code path — no bucket name mismatch.
  useEffect(() => {
    if (!projectId) return;
    const cleanup = triggerSeparation(
      null, // no POST — just open the stream to check current status
      (sortedStems) => {
        setStems(sortedStems);
        setStatus("completed");
      },
      () => {
        // not started yet — stay idle, don't surface as error
      },
      true, // streamOnly flag
    );
    return cleanup;
  }, [projectId]);

  // ── trigger separation ────────────────────────────────────
  const handleSeparate = async () => {
    if (!audioFile?.id) return;

    cleanupStreamRef.current?.();
    setStatus("processing");
    setSeparationError(null);
    setStems([]);

    cleanupStreamRef.current = await triggerSeparation(
      audioFile.id,
      (sortedStems) => {
        setStems(sortedStems);
        setStatus("completed");
      },
      (errMsg) => {
        setSeparationError(errMsg);
        setStatus("error");
      },
    );
  };

  // ── cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      cleanupStreamRef.current?.();
    };
  }, []);

  const isProcessing = status === "processing";
  const isCompleted  = status === "completed";
  const hasError     = status === "failed" || status === "error";
  const displayAudio = audioFile || reduxAudioFile;

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barDance {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg,
            oklch(0.829 0.1712 81.0381) 0%,
            oklch(0.92 0.18 95) 45%,
            oklch(0.829 0.1712 81.0381) 80%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <div className="w-full" style={{ fontFamily: "system-ui, sans-serif" }}>
        <HeadersSection
          title="SOURCE SEPARATION"
          icon={Scissors}
          songName={displayAudio?.file_name || "track_01_final_mix.wav · 4:23"}
        />

        {/* ── Loading primary audio ── */}
        {audioLoading && (
          <div className="mt-10 max-w-4xl mx-auto flex items-center gap-3 text-zinc-400 px-2">
            <Loader2 className="h-5 w-5 animate-spin text-yellow-400" />
            <span className="text-sm">Loading audio…</span>
          </div>
        )}

        {/* ── Error fetching primary audio ── */}
        {audioError && !audioLoading && (
          <div className="mt-8 max-w-4xl mx-auto rounded-3xl border border-red-500/20 bg-red-500/10 p-6 flex gap-3">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">Could not load audio</p>
              <p className="text-zinc-400 text-sm mt-1">{audioError}</p>
              <button
                onClick={fetchPrimaryAudio}
                className="mt-3 text-sm text-yellow-400 hover:text-yellow-300 underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── Source Audio Card ── */}
        {!audioLoading && displayAudio?.file_url && (
          <div
            className="mt-8 max-w-4xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-6"
            style={{ animation: "fadeSlideIn 0.3s ease both" }}
          >
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
              Source Audio
            </p>
            <SourceAudioPlayer
              audioUrl={displayAudio.file_url}
              fileName={displayAudio.file_name}
            />

            {!isCompleted && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSeparate}
                  disabled={isProcessing || !audioFile?.id}
                  className="
                    flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm
                    bg-linear-to-r from-yellow-400 to-pink-500
                    text-black shadow-lg shadow-yellow-400/20
                    hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                >
                  {isProcessing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Separating…</>
                  ) : (
                    <><Scissors className="h-4 w-4" /> Separate Audio</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── No audio fallback ── */}
        {!audioLoading && !displayAudio?.file_url && !audioError && status === "idle" && (
          <div className="mt-10 max-w-4xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-zinc-400">No audio file found for this project.</p>
          </div>
        )}

        {/* ── Processing ── */}
        {isProcessing && (
          <div
            className="mt-6 max-w-4xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-8"
            style={{ animation: "fadeSlideIn 0.3s ease both" }}
          >
            <div className="flex items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
              <div>
                <h2 className="text-2xl font-semibold">Separating Stems…</h2>
                <p className="text-zinc-400 text-sm">
                  AI is isolating vocals, drums, bass and other tracks
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Separation error ── */}
        {hasError && (
          <div
            className="mt-6 max-w-4xl mx-auto rounded-3xl border border-red-500/20 bg-red-500/10 p-6 flex gap-3"
            style={{ animation: "fadeSlideIn 0.3s ease both" }}
          >
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">Separation Failed</p>
              <p className="text-zinc-400 text-sm mt-1">{separationError}</p>
              <button
                onClick={handleSeparate}
                className="mt-3 text-sm text-yellow-400 hover:text-yellow-300 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {isCompleted && stems.length > 0 && (
          <div
            className="mt-6 max-w-4xl mx-auto space-y-4"
            style={{ animation: "fadeSlideIn 0.4s ease both" }}
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle2 className="text-emerald-400 h-5 w-5 shrink-0" />
              <p className="text-emerald-300 text-sm font-medium">
                Separation complete — {stems.length} stems ready
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {stems.map((stem, i) => (
                <StemCard
                  key={stem.id}
                  stemKey={stem.source_type}
                  stem={stem}
                  animationDelay={i * 120}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}