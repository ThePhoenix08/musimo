"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  Play,
  Pause,
  Volume2,
  Clock,
  FileAudio,
  Info,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

const truncateFilename = (filename = "", maxLength = 22) => {
  if (filename.length <= maxLength) return filename;
  const ext = filename.split(".").pop();
  const base = filename.slice(0, filename.length - ext.length - 1);
  return `${base.slice(0, maxLength - 4 - ext.length)}…${ext}`;
};

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getMimeLabel = (type = "") => {
  const map = {
    "audio/mpeg": "MP3",
    "audio/mp3": "MP3",
    "audio/wav": "WAV",
    "audio/x-wav": "WAV",
    "audio/ogg": "OGG",
    "audio/flac": "FLAC",
    "audio/aac": "AAC",
    "audio/webm": "WEBM",
    "audio/mp4": "M4A",
  };
  return map[type] || type.split("/")[1]?.toUpperCase() || "AUDIO";
};

// ── Real Waveform via Web Audio API ─────────────────────────────────────────

const RealWaveform = ({
  audioBuffer,
  currentTime,
  duration,
  onSeek,
  width = 280,
  height = 40,
  bars = 60,
}) => {
  const barData = useRef([]);

  // Build bar heights from audio buffer (once)
  if (audioBuffer && barData.current.length === 0) {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / bars);
    const data = [];
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j]);
      }
      data.push(sum / blockSize);
    }
    const max = Math.max(...data, 0.001);
    barData.current = data.map((v) => v / max);
  }

  const progress = duration > 0 ? currentTime / duration : 0;
  const barWidth = (width / bars) * 0.5;
  const spacing = (width / bars) * 0.5;
  const totalW = (barWidth + spacing) * bars - spacing;
  const startX = (width - totalW) / 2;
  const centerY = height / 2;
  const rx = barWidth * 0.6;
  const minH = height * 0.08;

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek?.(ratio * duration);
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="cursor-pointer"
      onClick={handleClick}
    >
      {(barData.current.length > 0
        ? barData.current
        : Array.from({ length: bars }, () => Math.random() * 0.7 + 0.1)
      ).map((amp, i) => {
        const x = startX + i * (barWidth + spacing);
        const bh = Math.max(amp * height * 0.85, minH);
        const topY = centerY - bh / 2;
        const played = i / bars < progress;
        const active = Math.abs(i / bars - progress) < 1 / bars;
        return (
          <rect
            key={i}
            x={x}
            y={topY}
            width={barWidth}
            height={bh}
            rx={rx}
            ry={rx}
            className={cn(
              "transition-colors duration-75",
              played || active ? "fill-primary" : "fill-muted-foreground/40",
            )}
            style={active ? { filter: "brightness(1.3)" } : undefined}
          />
        );
      })}
    </svg>
  );
};

// ── Dummy waveform for pre-decode state ──────────────────────────────────────

const DummyWaveform = ({ width = 180, height = 32, bars = 40 }) => {
  const heights = useRef(
    Array.from({ length: bars }, () => Math.random() * 0.65 + 0.1),
  );
  const bw = (width / bars) * 0.5;
  const sp = (width / bars) * 0.5;
  const totalW = (bw + sp) * bars - sp;
  const sx = (width - totalW) / 2;
  const cy = height / 2;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {heights.current.map((amp, i) => {
        const bh = Math.max(amp * height * 0.85, height * 0.08);
        return (
          <rect
            key={i}
            x={sx + i * (bw + sp)}
            y={cy - bh / 2}
            width={bw}
            height={bh}
            rx={bw * 0.6}
            ry={bw * 0.6}
            className="fill-muted-foreground/50"
          />
        );
      })}
    </svg>
  );
};

// ── Upload Card Base ─────────────────────────────────────────────────────────

const UploadCardBase = ({ children, isDragOver, isUploading }) => {
  const hasChildren = React.Children.count(children) > 0;
  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed border-border/60 p-6 backdrop-blur-sm min-h-[120px] flex items-center justify-center relative transition-colors duration-200 h-full",
        !isUploading && "cursor-pointer hover:bg-accent/20",
        isUploading
          ? "bg-primary/20 border-primary/60"
          : isDragOver
            ? "bg-accent/40 border-accent/80 shadow-inner"
            : "bg-card",
      )}
    >
      {!hasChildren && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Upload
            size={48}
            className={cn(
              "transition-colors duration-200",
              isDragOver ? "text-primary" : "text-muted",
              isUploading && "text-primary",
            )}
          />
        </div>
      )}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};

// ── Audio Player Card ─────────────────────────────────────────────────────────

const AudioPlayerCard = ({ file, audioBuffer, onRemove }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const objectUrlRef = useRef(null);

  // Create object URL once
  useEffect(() => {
    objectUrlRef.current = URL.createObjectURL(file);
    if (audioRef.current) {
      audioRef.current.src = objectUrlRef.current;
    }
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [file]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRemove = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setIsRemoving(true);
    setTimeout(() => onRemove?.(), 400);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isRemoving ? "removing" : "active"}
        className="relative z-20 w-full flex justify-center"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
        }}
        exit={{
          opacity: 0,
          scale: 0.9,
          y: 10,
          filter: "blur(6px)",
          transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
        }}
      >
        <motion.div
          initial={{ scale: 1.5 }}
          animate={[
            { scale: 1.1 },
            {
              scale: 1.0,
              transition: { duration: 0.8, ease: [0.68, -0.55, 0.265, 1.55] },
            },
          ]}
          className="rounded-xl border border-border/40 bg-card shadow-xl backdrop-blur-sm relative group w-72"
        >
          {/* Hidden audio element */}
          <audio ref={audioRef} preload="metadata" />

          {/* Remove button */}
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110 z-30"
          >
            <X size={12} />
          </button>

          <div className="p-3 space-y-2.5">
            {/* File name + meta toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <FileAudio size={13} className="text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground truncate">
                  {truncateFilename(file.name)}
                </span>
              </div>
              <button
                onClick={() => setShowMeta((v) => !v)}
                className={cn(
                  "shrink-0 rounded-md p-0.5 transition-colors",
                  showMeta
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Info size={13} />
              </button>
            </div>

            {/* Metadata panel */}
            <AnimatePresence>
              {showMeta && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/60 px-2 py-1.5">
                    {[
                      { label: "Type", value: getMimeLabel(file.type) },
                      { label: "Size", value: formatFileSize(file.size) },
                      { label: "Duration", value: formatTime(duration) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col items-center">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          {label}
                        </span>
                        <span className="text-[11px] font-semibold text-foreground">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Waveform */}
            <div className="flex items-center justify-center">
              <RealWaveform
                audioBuffer={audioBuffer}
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                width={248}
                height={40}
                bars={60}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:brightness-110 transition-all active:scale-95"
              >
                {isPlaying ? (
                  <Pause size={13} fill="currentColor" />
                ) : (
                  <Play
                    size={13}
                    fill="currentColor"
                    className="translate-x-px"
                  />
                )}
              </button>

              {/* Time */}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums shrink-0">
                <Clock size={9} />
                <span>{formatTime(currentTime)}</span>
                <span className="opacity-40">/</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Progress bar (thin) */}
              <div
                className="relative h-1 flex-1 cursor-pointer rounded-full bg-muted overflow-hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleSeek(((e.clientX - rect.left) / rect.width) * duration);
                }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  style={{
                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  }}
                />
              </div>

              {/* Volume icon (decorative) */}
              <Volume2 size={11} className="text-muted-foreground shrink-0" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Main Export ───────────────────────────────────────────────────────────────

export function AudioUploadCard({
  className,
  title = "Upload Your Audio",
  description = "Drop in your recordings and start transcribing instantly.",
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const fileInputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("audio/")) return;
    setUploadedFile(file);
    setIsUploading(true);

    // Decode audio for real waveform
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decoded);
    } catch {
      setAudioBuffer(null);
    }

    setTimeout(() => {
      setIsUploading(false);
    }, 200);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = Array.from(e.dataTransfer.files).find((f) =>
        f.type.startsWith("audio/"),
      );
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setAudioBuffer(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleBaseClick = useCallback(() => {
    if (!isUploading && !uploadedFile) fileInputRef.current?.click();
  }, [isUploading, uploadedFile]);

  const renderAudioUploadArea = uploadedFile == null;

  return (
    <motion.div
      className={cn("relative w-full h-full", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 text-center h-full">
        <div className="flex flex-col justify-center space-y-8 h-full">
          {renderAudioUploadArea ? (
            <div className="relative w-full mx-auto h-full">
              <div
                className="relative h-full"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBaseClick}
              >
                <UploadCardBase
                  isDragOver={isDragOver}
                  isUploading={isUploading}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </div>
            </div>
          ) : (
            <AudioPlayerCard
              file={uploadedFile}
              audioBuffer={audioBuffer}
              onRemove={handleRemoveFile}
            />
          )}

          <div className="flex flex-col items-start">
            <h2 className="text-lg font-semibold text-foreground text-left">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground text-left">
              {description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
