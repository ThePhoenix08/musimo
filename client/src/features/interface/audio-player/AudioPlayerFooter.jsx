/**
 * AudioPlayerFooter.jsx
 *
 * A three-mode expandable audio player footer for InterfacePage.
 * Modes: "mini" | "normal" | "expanded" — URL-synced via ?player= param.
 *
 * Features:
 *  - Mini: flat line progress strip, time, play/pause
 *  - Normal: real waveform (Web Audio API), controls, emotion colour strip
 *  - Expanded: zoomable waveform, trim handles, overview+detail dual view,
 *              beat markers, emotion timeline, spectrum analyser (canvas),
 *              RMS energy chart, loop region, playback rate
 *
 * Integrates with audioPlayer.slice via Redux (seekRequest, emotionSegments …)
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  EyeOff,
  Activity,
  Music,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  selectAudioUrl,
  selectAudioName,
  selectIsPlaying,
  selectCurrentTime,
  selectDuration,
  selectVolume,
  selectIsMuted,
  selectPlaybackRate,
  selectPlayerMode,
  selectWaveformPeaks,
  selectZoomWindow,
  selectEmotionSegments,
  selectSeekRequest,
  selectLoopEnabled,
  selectLoopRegion,
  selectBeatTimestamps,
  selectShowBeats,
  selectCurrentEmotion,
  setPlaying,
  setCurrentTime,
  setDuration,
  setVolume,
  toggleMute,
  setPlaybackRate,
  setPlayerMode,
  setZoomWindow,
  resetZoom,
  toggleLoop,
  clearSeekRequest,
  toggleBeats,
  setWaveformPeaks,
  PLAYER_MODES,
  GES_LABELS,
} from "@/features/interface/audio-player/AudioPlayer.slice";

// ─── Constants ────────────────────────────────────────────────────────────────

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const MODE_PARAM = "player"; // URL search param key

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (s) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/** Extract normalised bar peaks from an AudioBuffer */
const extractPeaks = (buffer, numBars) => {
  const ch = buffer.getChannelData(0);
  const block = Math.floor(ch.length / numBars);
  const peaks = [];
  for (let i = 0; i < numBars; i++) {
    let max = 0;
    for (let j = 0; j < block; j++) {
      const v = Math.abs(ch[i * block + j]);
      if (v > max) max = v;
    }
    peaks.push(max);
  }
  const mx = Math.max(...peaks, 1e-6);
  return peaks.map((v) => v / mx);
};

/** Returns the GES colour for a given fractional position, interpolated */
const emotionColorAt = (fraction, duration, segments) => {
  if (!segments?.length || !duration) return null;
  const t = fraction * duration;
  const seg = segments.find((e) => t >= e.startTime && t < e.endTime);
  return seg ? (GES_LABELS[seg.emotion]?.color ?? null) : null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * MiniProgressLine — a simple animated line for mini mode
 */
const MiniProgressLine = ({ progress, onSeek, duration }) => {
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  };
  return (
    <div
      className="relative h-1 w-full cursor-pointer group"
      onClick={handleClick}
    >
      <div className="absolute inset-0 rounded-full bg-border/60" />
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-75"
        style={{ width: `${progress * 100}%` }}
      />
      {/* Thumb dot on hover */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-md opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
        style={{ left: `${progress * 100}%` }}
      />
    </div>
  );
};

/**
 * WaveformSVG — the core waveform renderer.
 * Supports emotion colouring, beat markers, progress playhead, click-to-seek.
 */
const WaveformSVG = React.memo(
  ({
    peaks,
    progress,
    duration,
    onSeek,
    emotionSegments,
    beatTimestamps,
    showBeats,
    height = 56,
    barCount,
    startFraction = 0,
    endFraction = 1,
    className,
  }) => {
    const containerRef = useRef(null);
    const [width, setWidth] = useState(0);

    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const visiblePeaks = useMemo(() => {
      if (!peaks?.length) return [];
      const start = Math.floor(startFraction * peaks.length);
      const end = Math.ceil(endFraction * peaks.length);
      const slice = peaks.slice(start, end);
      // resample to barCount
      const target = barCount ?? Math.max(40, Math.floor(width / 5));
      if (slice.length <= target) return slice;
      const result = [];
      const ratio = slice.length / target;
      for (let i = 0; i < target; i++) {
        const from = Math.floor(i * ratio);
        const to = Math.floor((i + 1) * ratio);
        let max = 0;
        for (let j = from; j < to; j++) max = Math.max(max, slice[j] ?? 0);
        result.push(max);
      }
      return result;
    }, [peaks, startFraction, endFraction, barCount, width]);

    const numBars = visiblePeaks.length;
    if (!width || !numBars) {
      return (
        <div
          ref={containerRef}
          className={cn("w-full", className)}
          style={{ height }}
        />
      );
    }

    const gap = Math.max(1, width * 0.006);
    const bw = Math.max(1.5, (width - gap * (numBars - 1)) / numBars);
    const cx = height / 2;
    const minH = height * 0.06;

    // fractional progress within this visible window
    const windowProgress =
      (progress - startFraction) / Math.max(endFraction - startFraction, 1e-6);
    const clampedWP = Math.max(0, Math.min(1, windowProgress));

    const handleClick = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      // map back to global fraction
      const globalFrac = startFraction + ratio * (endFraction - startFraction);
      onSeek?.(globalFrac * duration);
    };

    return (
      <div
        ref={containerRef}
        className={cn("w-full cursor-pointer select-none", className)}
        style={{ height }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          onClick={handleClick}
        >
          {visiblePeaks.map((amp, i) => {
            const x = i * (bw + gap);
            const bh = Math.max(amp * height * 0.88, minH);
            const topY = cx - bh / 2;
            const frac = i / numBars;
            const played = frac < clampedWP;
            const isHead = Math.abs(frac - clampedWP) < 1.5 / numBars;

            // emotion colour
            const globalFrac =
              startFraction + frac * (endFraction - startFraction);
            const emoColor = emotionColorAt(
              globalFrac,
              duration,
              emotionSegments,
            );

            let fill;
            if (isHead) {
              fill = "var(--color-primary)";
            } else if (played) {
              fill = emoColor ? emoColor + "dd" : "var(--color-primary)";
            } else {
              fill = emoColor
                ? emoColor + "55"
                : "var(--color-muted-foreground)";
              if (!emoColor && !played) {
                fill =
                  "color-mix(in oklch, var(--color-muted-foreground) 35%, transparent)";
              }
            }

            return (
              <rect
                key={i}
                x={x}
                y={topY}
                width={bw}
                height={bh}
                rx={bw * 0.45}
                ry={bw * 0.45}
                fill={fill}
                style={
                  isHead
                    ? {
                        filter:
                          "brightness(1.4) drop-shadow(0 0 4px var(--color-primary))",
                      }
                    : undefined
                }
              />
            );
          })}

          {/* Beat markers */}
          {showBeats &&
            beatTimestamps?.map((t, i) => {
              const globalFrac = duration > 0 ? t / duration : 0;
              if (globalFrac < startFraction || globalFrac > endFraction)
                return null;
              const localFrac =
                (globalFrac - startFraction) /
                Math.max(endFraction - startFraction, 1e-6);
              const bx = localFrac * width;
              return (
                <line
                  key={i}
                  x1={bx}
                  x2={bx}
                  y1={0}
                  y2={height}
                  stroke="var(--color-primary)"
                  strokeWidth={0.75}
                  strokeOpacity={0.45}
                  strokeDasharray="2,2"
                />
              );
            })}

          {/* Playhead */}
          {clampedWP >= 0 && clampedWP <= 1 && (
            <line
              x1={clampedWP * width}
              x2={clampedWP * width}
              y1={0}
              y2={height}
              stroke="var(--color-primary)"
              strokeWidth={1.5}
              strokeOpacity={0.9}
            />
          )}
        </svg>
      </div>
    );
  },
);
WaveformSVG.displayName = "WaveformSVG";

/**
 * EmotionTimeline — compact colour strip with emoji markers (expanded mode)
 */
const EmotionTimeline = ({
  segments,
  duration,
  currentTime,
  onSeek,
  height = 28,
}) => {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!segments?.length || !duration) return null;

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full cursor-pointer"
      style={{ height }}
      onClick={handleClick}
    >
      {width > 0 &&
        segments.map((seg, i) => {
          const left = (seg.startTime / duration) * width;
          const segWidth = ((seg.endTime - seg.startTime) / duration) * width;
          const info = GES_LABELS[seg.emotion];
          if (!info) return null;
          const showEmoji = segWidth > 24;
          return (
            <div
              key={i}
              className="absolute top-0 flex flex-col items-center justify-center overflow-hidden rounded-sm transition-opacity hover:opacity-90"
              style={{
                left,
                width: segWidth,
                height,
                backgroundColor: info.color + "55",
                borderLeft: `2px solid ${info.color}`,
              }}
              title={`${info.label} (${fmt(seg.startTime)}–${fmt(seg.endTime)})`}
            >
              {showEmoji && (
                <span
                  className="text-xs leading-none select-none"
                  style={{ fontSize: Math.min(14, segWidth * 0.35) }}
                >
                  {info.emoji}
                </span>
              )}
            </div>
          );
        })}

      {/* Playhead */}
      {duration > 0 && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/70 pointer-events-none"
          style={{ left: (currentTime / duration) * width }}
        />
      )}
    </div>
  );
};

/**
 * ZoomHandle — draggable handle for waveform trim view
 */
const ZoomHandle = ({ side, position, onDrag }) => {
  const dragRef = useRef({ active: false, startX: 0, startPos: 0 });
  const handleRef = useRef(null);

  const onMouseDown = (e) => {
    e.preventDefault();
    dragRef.current = { active: true, startX: e.clientX, startPos: position };
    const onMove = (ev) => {
      if (!dragRef.current.active) return;
      const dx = ev.clientX - dragRef.current.startX;
      const parentWidth =
        handleRef.current?.parentElement?.getBoundingClientRect().width ?? 1;
      onDrag(dragRef.current.startPos + dx / parentWidth);
    };
    const onUp = () => {
      dragRef.current.active = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={handleRef}
      className={cn(
        "absolute top-0 bottom-0 w-1.5 cursor-ew-resize z-20 flex items-center justify-center",
        side === "left"
          ? "rounded-l-sm border-l-2 border-primary/80 bg-primary/20"
          : "rounded-r-sm border-r-2 border-primary/80 bg-primary/20",
      )}
      style={{ left: `${position * 100}%`, transform: "translateX(-50%)" }}
      onMouseDown={onMouseDown}
    >
      <div className="w-0.5 h-4 rounded-full bg-primary/70" />
    </div>
  );
};

/**
 * SpectrumCanvas — real-time frequency spectrum analyser
 */
const SpectrumCanvas = ({ analyserNode, isPlaying, height = 60 }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserNode) return;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const barW = Math.max(1, (w / bufferLength) * 2.5);
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barH = (dataArray[i] / 255) * h;
        const hue = (i / bufferLength) * 240;
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
        ctx.fillRect(x, h - barH, barW, barH);
        x += barW + 1;
        if (x > w) break;
      }
    };

    if (isPlaying) {
      draw();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyserNode, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-md bg-muted/30"
      style={{ height }}
      width={600}
      height={height}
    />
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AudioPlayerFooter() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Redux state ─────────────────────────────────────────────────────────────
  const audioUrl = useSelector(selectAudioUrl);
  const audioName = useSelector(selectAudioName);
  const isPlaying = useSelector(selectIsPlaying);
  const currentTime = useSelector(selectCurrentTime);
  const duration = useSelector(selectDuration);
  const volume = useSelector(selectVolume);
  const isMuted = useSelector(selectIsMuted);
  const playbackRate = useSelector(selectPlaybackRate);
  const playerMode = useSelector(selectPlayerMode);
  const peaks = useSelector(selectWaveformPeaks);
  const zoomWindow = useSelector(selectZoomWindow);
  const emotionSegments = useSelector(selectEmotionSegments);
  const seekRequest = useSelector(selectSeekRequest);
  const loopEnabled = useSelector(selectLoopEnabled);
  const loopRegion = useSelector(selectLoopRegion);
  const beatTimestamps = useSelector(selectBeatTimestamps);
  const showBeats = useSelector(selectShowBeats);
  const currentEmotion = useSelector(selectCurrentEmotion);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const isDecodingRef = useRef(false);

  // ── Local UI state ───────────────────────────────────────────────────────────
  const [isDecoding, setIsDecoding] = useState(false);

  // ── Sync player mode with URL param ─────────────────────────────────────────
  useEffect(() => {
    const modeFromUrl = searchParams.get(MODE_PARAM);
    const validModes = Object.values(PLAYER_MODES);
    if (
      modeFromUrl &&
      validModes.includes(modeFromUrl) &&
      modeFromUrl !== playerMode
    ) {
      dispatch(setPlayerMode(modeFromUrl));
    } else {
      dispatch(setPlayerMode(PLAYER_MODES.NORMAL));
      () => setSearchParams(PLAYER_MODES.NORMAL);
    }
  }, [searchParams]); // eslint-disable-line

  const changeMode = useCallback(
    (mode) => {
      dispatch(setPlayerMode(mode));
      const next = new URLSearchParams(searchParams);
      if (mode === PLAYER_MODES.NORMAL) {
        next.delete(MODE_PARAM); // normal is default, keep URL clean
      } else {
        next.set(MODE_PARAM, mode);
      }
      setSearchParams(next);
    },
    [dispatch, searchParams, setSearchParams],
  );

  // ── Audio element setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!audioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    audio.crossOrigin = "anonymous";
    audio.src = audioUrl;
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;

    const onLoaded = () => dispatch(setDuration(audio.duration));
    const onTime = () => {
      dispatch(setCurrentTime(audio.currentTime));
      // Loop handling
      if (loopEnabled && audio.currentTime >= loopRegion.end) {
        audio.currentTime = loopRegion.start;
      }
    };
    const onEnded = () => dispatch(setPlaying(false));

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);

    // Decode waveform peaks
    if (!isDecodingRef.current && !peaks.length) {
      setIsDecoding(true);
      isDecodingRef.current = true;
      fetch(audioUrl)
        .then((r) => r.arrayBuffer())
        .then((ab) => {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          return ctx.decodeAudioData(ab);
        })
        .then((buf) => {
          const p = extractPeaks(buf, 800);
          dispatch(setWaveformPeaks(p));
          setIsDecoding(false);
        })
        .catch(() => setIsDecoding(false));
    }

    // Set up analyser
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const src = ctx.createMediaElementSource(audio);
      src.connect(analyser);
      analyser.connect(ctx.destination);
      sourceRef.current = src;
    }

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // Sync volume/mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audioCtxRef.current?.resume();
      audio.play().catch(() => dispatch(setPlaying(false)));
    } else {
      audio.pause();
    }
  }, [isPlaying, dispatch]);

  // Honour external seek requests
  useEffect(() => {
    if (!seekRequest) return;
    if (audioRef.current) {
      audioRef.current.currentTime = seekRequest.time;
      dispatch(setCurrentTime(seekRequest.time));
    }
    dispatch(clearSeekRequest());
  }, [seekRequest, dispatch]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSeek = useCallback(
    (time) => {
      const t = Math.max(0, Math.min(duration, time));
      if (audioRef.current) audioRef.current.currentTime = t;
      dispatch(setCurrentTime(t));
    },
    [duration, dispatch],
  );

  const handlePlayPause = useCallback(() => {
    dispatch(setPlaying(!isPlaying));
  }, [dispatch, isPlaying]);

  const handleSkip = useCallback(
    (delta) => {
      handleSeek(currentTime + delta);
    },
    [currentTime, handleSeek],
  );

  const handleVolumeChange = useCallback(
    (e) => dispatch(setVolume(Number(e.target.value))),
    [dispatch],
  );

  const handleZoomLeft = useCallback(
    (pos) => {
      const clamped = Math.max(0, Math.min(pos, zoomWindow.end - 0.02));
      dispatch(setZoomWindow({ start: clamped, end: zoomWindow.end }));
    },
    [dispatch, zoomWindow],
  );

  const handleZoomRight = useCallback(
    (pos) => {
      const clamped = Math.min(1, Math.max(pos, zoomWindow.start + 0.02));
      dispatch(setZoomWindow({ start: zoomWindow.start, end: clamped }));
    },
    [dispatch, zoomWindow],
  );

  const handleRateChange = useCallback(() => {
    const idx = RATES.indexOf(playbackRate);
    dispatch(setPlaybackRate(RATES[(idx + 1) % RATES.length]));
  }, [dispatch, playbackRate]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const progress = duration > 0 ? currentTime / duration : 0;
  const currentEmotionInfo = currentEmotion ? GES_LABELS[currentEmotion] : null;
  const isMini = playerMode === PLAYER_MODES.MINI;
  const isNormal = playerMode === PLAYER_MODES.NORMAL;
  const isExpanded = playerMode === PLAYER_MODES.EXPANDED;

  // ── Don't render if no audio loaded and hidden ────────────────────────────
  if (!audioUrl) return null;

  return (
    <>
      {/* Hidden audio element — always in DOM when URL exists */}
      <audio ref={audioRef} preload="metadata" />

      <AnimatePresence mode="wait">
        {(
          <motion.div
            key="footer"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className={cn(
              "absolute bottom-0 left-0 right-0",
              "z-50 border-t-2 border-border bg-card/95 backdrop-blur-md",
              "flex flex-col",
              isMini && "h-20",
              isNormal && "h-fit",
              isExpanded && "h-[calc(100vh-3rem)]", // full minus top nav
            )}
            style={{
              boxShadow: currentEmotionInfo
                ? `0 -2px 24px ${currentEmotionInfo.color}33`
                : undefined,
            }}
          >
            {/* ── Mode toggle bar ─────────────────────────────────────────── */}
            <ModeToggleBar
              mode={playerMode}
              onChangeMode={changeMode}
              audioName={audioName}
              currentEmotionInfo={currentEmotionInfo}
              isDecoding={isDecoding}
            />

            {/* ── Content by mode ────────────────────────────────────────── */}
            {isMini && (
              <MiniContent
                progress={progress}
                duration={duration}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onSeek={handleSeek}
                onPlayPause={handlePlayPause}
                onSkip={handleSkip}
                volume={volume}
                isMuted={isMuted}
                onVolumeChange={handleVolumeChange}
                onToggleMute={() => dispatch(toggleMute())}
                emotionSegments={emotionSegments}
              />
            )}

            {isNormal && (
              <NormalContent
                peaks={peaks}
                progress={progress}
                duration={duration}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onSeek={handleSeek}
                onPlayPause={handlePlayPause}
                onSkip={handleSkip}
                volume={volume}
                isMuted={isMuted}
                onVolumeChange={handleVolumeChange}
                onToggleMute={() => dispatch(toggleMute())}
                playbackRate={playbackRate}
                onRateChange={handleRateChange}
                emotionSegments={emotionSegments}
                beatTimestamps={beatTimestamps}
                showBeats={showBeats}
                onToggleBeats={() => dispatch(toggleBeats())}
                loopEnabled={loopEnabled}
                onToggleLoop={() => dispatch(toggleLoop())}
                isDecoding={isDecoding}
              />
            )}

            {isExpanded && (
              <ExpandedContent
                peaks={peaks}
                progress={progress}
                duration={duration}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onSeek={handleSeek}
                onPlayPause={handlePlayPause}
                onSkip={handleSkip}
                volume={volume}
                isMuted={isMuted}
                onVolumeChange={handleVolumeChange}
                onToggleMute={() => dispatch(toggleMute())}
                playbackRate={playbackRate}
                onRateChange={handleRateChange}
                emotionSegments={emotionSegments}
                beatTimestamps={beatTimestamps}
                showBeats={showBeats}
                onToggleBeats={() => dispatch(toggleBeats())}
                loopEnabled={loopEnabled}
                onToggleLoop={() => dispatch(toggleLoop())}
                zoomWindow={zoomWindow}
                onZoomLeft={handleZoomLeft}
                onZoomRight={handleZoomRight}
                onResetZoom={() => dispatch(resetZoom())}
                analyserNode={analyserRef.current}
                isDecoding={isDecoding}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── ModeToggleBar ────────────────────────────────────────────────────────────

function ModeToggleBar({
  mode,
  onChangeMode,
  audioName,
  currentEmotionInfo,
  isDecoding,
}) {
  const isMini = mode === PLAYER_MODES.MINI;
  const isExpanded = mode === PLAYER_MODES.EXPANDED;

  return (
    <div className="flex items-center justify-between px-3 h-6 shrink-0 border-b border-border/40">
      <div className="flex items-center gap-2 min-w-0">
        <Music size={11} className="text-muted-foreground shrink-0" />
        <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[180px]">
          {audioName ?? "No track loaded"}
        </span>
        {isDecoding && (
          <Loader2 size={10} className="animate-spin text-muted-foreground" />
        )}
        {currentEmotionInfo && !isDecoding && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{
              background: currentEmotionInfo.color + "33",
              color: currentEmotionInfo.color,
              border: `1px solid ${currentEmotionInfo.color}66`,
            }}
          >
            {currentEmotionInfo.emoji} {currentEmotionInfo.label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        {/* Mini toggle */}
        <ModeBtn
          active={isMini}
          title="Compact"
          onClick={() =>
            onChangeMode(isMini ? PLAYER_MODES.NORMAL : PLAYER_MODES.MINI)
          }
        >
          <ChevronDown size={12} />
        </ModeBtn>
        {/* Expand toggle */}
        <ModeBtn
          active={isExpanded}
          title="Expanded"
          onClick={() =>
            onChangeMode(
              isExpanded ? PLAYER_MODES.NORMAL : PLAYER_MODES.EXPANDED,
            )
          }
        >
          {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </ModeBtn>
      </div>
    </div>
  );
}

const ModeBtn = ({ active, title, onClick, children }) => (
  <button
    title={title}
    onClick={onClick}
    className={cn(
      "w-6 h-5 flex items-center justify-center rounded transition-colors",
      active
        ? "bg-primary/20 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    )}
  >
    {children}
  </button>
);

// ─── MiniContent ──────────────────────────────────────────────────────────────

function MiniContent({
  progress,
  duration,
  currentTime,
  isPlaying,
  onSeek,
  onPlayPause,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  emotionSegments,
}) {
  return (
    <div className="flex flex-col px-4 py-1.5 gap-1.5 flex-1 min-h-0">
      {/* Emotion-coloured mini progress line */}
      <div className="relative w-full">
        <MiniProgressLine
          progress={progress}
          duration={duration}
          onSeek={onSeek}
        />
        {/* Emotion colour marks underneath */}
        {emotionSegments?.length > 0 && duration > 0 && (
          <div className="absolute -bottom-0.5 left-0 right-0 flex h-0.5">
            {emotionSegments.map((seg, i) => {
              const info = GES_LABELS[seg.emotion];
              if (!info) return null;
              return (
                <div
                  key={i}
                  className="h-full"
                  style={{
                    width: `${((seg.endTime - seg.startTime) / duration) * 100}%`,
                    backgroundColor: info.color,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPlayPause}
          className="w-7 h-7 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center hover:brightness-110 active:scale-95 transition-all"
        >
          {isPlaying ? (
            <Pause size={12} fill="currentColor" />
          ) : (
            <Play size={12} fill="currentColor" className="translate-x-px" />
          )}
        </button>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {fmt(currentTime)}
          <span className="opacity-40 mx-0.5">/</span>
          {fmt(duration)}
        </span>
        <div className="flex-1" />
        <button
          onClick={onToggleMute}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={onVolumeChange}
          className="w-16 accent-primary h-1"
        />
      </div>
    </div>
  );
}

// ─── NormalContent ────────────────────────────────────────────────────────────

function NormalContent({
  peaks,
  progress,
  duration,
  currentTime,
  isPlaying,
  onSeek,
  onPlayPause,
  onSkip,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  playbackRate,
  onRateChange,
  emotionSegments,
  beatTimestamps,
  showBeats,
  onToggleBeats,
  loopEnabled,
  onToggleLoop,
  isDecoding,
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0 px-4 py-2 gap-1.5">
      {/* Waveform */}
      <div className="flex-1 min-h-0">
        {isDecoding || !peaks.length ? (
          <div className="w-full h-full flex items-center justify-center">
            {isDecoding ? (
              <Loader2
                size={16}
                className="animate-spin text-muted-foreground"
              />
            ) : (
              <div className="w-full h-8 flex items-center">
                <div className="w-full h-0.5 bg-border rounded-full" />
              </div>
            )}
          </div>
        ) : (
          <WaveformSVG
            peaks={peaks}
            progress={progress}
            duration={duration}
            onSeek={onSeek}
            emotionSegments={emotionSegments}
            beatTimestamps={beatTimestamps}
            showBeats={showBeats}
            height={58}
            className="flex-1"
          />
        )}
      </div>

      {/* Controls */}
      <PlayerControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        playbackRate={playbackRate}
        loopEnabled={loopEnabled}
        showBeats={showBeats}
        onPlayPause={onPlayPause}
        onSkip={onSkip}
        onVolumeChange={onVolumeChange}
        onToggleMute={onToggleMute}
        onRateChange={onRateChange}
        onToggleLoop={onToggleLoop}
        onToggleBeats={onToggleBeats}
        compact={false}
      />
    </div>
  );
}

// ─── ExpandedContent ──────────────────────────────────────────────────────────

function ExpandedContent({
  peaks,
  progress,
  duration,
  currentTime,
  isPlaying,
  onSeek,
  onPlayPause,
  onSkip,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  playbackRate,
  onRateChange,
  emotionSegments,
  beatTimestamps,
  showBeats,
  onToggleBeats,
  loopEnabled,
  onToggleLoop,
  zoomWindow,
  onZoomLeft,
  onZoomRight,
  onResetZoom,
  analyserNode,
  isDecoding,
}) {
  const zoomFactor = useMemo(
    () => Math.round(1 / Math.max(zoomWindow.end - zoomWindow.start, 0.01)),
    [zoomWindow],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* ── Top section: detail waveform (zoomed) ─────────────────────────── */}
      <div className="flex-3 min-h-0 px-4 pt-2 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
          <span>
            Zoom ×{zoomFactor} — {fmt(zoomWindow.start * duration)} →{" "}
            {fmt(zoomWindow.end * duration)}
          </span>
          <div className="flex gap-1">
            <ControlBtn
              active={showBeats}
              onClick={onToggleBeats}
              title="Beat markers"
            >
              <Activity size={11} />
            </ControlBtn>
            <ControlBtn onClick={onResetZoom} title="Reset zoom">
              <ZoomOut size={11} />
            </ControlBtn>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          {isDecoding || !peaks.length ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2
                size={18}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : (
            <WaveformSVG
              peaks={peaks}
              progress={progress}
              duration={duration}
              onSeek={onSeek}
              emotionSegments={emotionSegments}
              beatTimestamps={beatTimestamps}
              showBeats={showBeats}
              startFraction={zoomWindow.start}
              endFraction={zoomWindow.end}
              height={120}
              className="flex-1"
            />
          )}
        </div>
      </div>

      {/* ── Spectrum analyser ─────────────────────────────────────────────── */}
      <div className="px-4 py-1.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Spectrum
          </span>
        </div>
        <SpectrumCanvas
          analyserNode={analyserNode}
          isPlaying={isPlaying}
          height={52}
        />
      </div>

      {/* ── Overview waveform with trim handles ───────────────────────────── */}
      <div className="px-4 py-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Overview — drag handles to zoom
          </span>
        </div>
        <div className="relative">
          {peaks.length > 0 && (
            <WaveformSVG
              peaks={peaks}
              progress={progress}
              duration={duration}
              onSeek={onSeek}
              emotionSegments={emotionSegments}
              height={36}
            />
          )}
          {/* Zoom overlay — shaded outside selection */}
          <div
            className="absolute inset-y-0 left-0 bg-background/50 pointer-events-none"
            style={{ width: `${zoomWindow.start * 100}%` }}
          />
          <div
            className="absolute inset-y-0 right-0 bg-background/50 pointer-events-none"
            style={{ width: `${(1 - zoomWindow.end) * 100}%` }}
          />
          {/* Selection border */}
          <div
            className="absolute inset-y-0 border-y-2 border-primary/70 pointer-events-none"
            style={{
              left: `${zoomWindow.start * 100}%`,
              right: `${(1 - zoomWindow.end) * 100}%`,
            }}
          />
          <ZoomHandle
            side="left"
            position={zoomWindow.start}
            onDrag={onZoomLeft}
          />
          <ZoomHandle
            side="right"
            position={zoomWindow.end}
            onDrag={onZoomRight}
          />
        </div>
      </div>

      {/* ── Emotion timeline ─────────────────────────────────────────────── */}
      {emotionSegments?.length > 0 && (
        <div className="px-4 py-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">
            Emotion Timeline (GES)
          </span>
          <EmotionTimeline
            segments={emotionSegments}
            duration={duration}
            currentTime={currentTime}
            onSeek={onSeek}
            height={30}
          />
          {/* Emotion legend */}
          <div className="flex flex-wrap gap-2 mt-1.5">
            {Object.entries(GES_LABELS).map(([key, info]) => (
              <div key={key} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: info.color }}
                />
                <span className="text-[9px] text-muted-foreground">
                  {info.emoji} {info.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Player controls ──────────────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-border/40 shrink-0">
        <PlayerControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          playbackRate={playbackRate}
          loopEnabled={loopEnabled}
          showBeats={showBeats}
          onPlayPause={onPlayPause}
          onSkip={onSkip}
          onVolumeChange={onVolumeChange}
          onToggleMute={onToggleMute}
          onRateChange={onRateChange}
          onToggleLoop={onToggleLoop}
          onToggleBeats={onToggleBeats}
          compact={false}
        />
      </div>
    </div>
  );
}

// ─── PlayerControls ───────────────────────────────────────────────────────────

function PlayerControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  loopEnabled,
  showBeats,
  onPlayPause,
  onSkip,
  onVolumeChange,
  onToggleMute,
  onRateChange,
  onToggleLoop,
  onToggleBeats,
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Skip back 10s */}
      <ControlBtn onClick={() => onSkip(-10)} title="−10s">
        <SkipBack size={13} />
      </ControlBtn>

      {/* Play / Pause */}
      <button
        onClick={onPlayPause}
        className="w-9 h-9 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center hover:brightness-110 active:scale-95 transition-all shadow-sm"
      >
        {isPlaying ? (
          <Pause size={15} fill="currentColor" />
        ) : (
          <Play size={15} fill="currentColor" className="translate-x-px" />
        )}
      </button>

      {/* Skip forward 10s */}
      <ControlBtn onClick={() => onSkip(10)} title="+10s">
        <SkipForward size={13} />
      </ControlBtn>

      {/* Time */}
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {fmt(currentTime)}
        <span className="opacity-40 mx-0.5">/</span>
        {fmt(duration)}
      </span>

      <div className="flex-1" />

      {/* Loop */}
      <ControlBtn active={loopEnabled} onClick={onToggleLoop} title="Loop">
        <Repeat size={12} />
      </ControlBtn>

      {/* Beat markers */}
      <ControlBtn
        active={showBeats}
        onClick={onToggleBeats}
        title="Beat markers"
      >
        <Activity size={12} />
      </ControlBtn>

      {/* Playback rate */}
      <button
        onClick={onRateChange}
        className="text-[11px] font-semibold tabular-nums px-2 h-7 rounded bg-muted hover:bg-muted/70 text-foreground transition-colors"
        title="Playback speed"
      >
        {playbackRate}×
      </button>

      {/* Volume */}
      <button
        onClick={onToggleMute}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={isMuted ? 0 : volume}
        onChange={onVolumeChange}
        className="w-20 accent-primary h-1 cursor-pointer"
      />
    </div>
  );
}

// ─── ControlBtn ───────────────────────────────────────────────────────────────

const ControlBtn = ({ active, onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={cn(
      "w-7 h-7 flex items-center justify-center rounded transition-colors",
      active
        ? "bg-primary/20 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    )}
  >
    {children}
  </button>
);
