import React from "react";
import { useSelector, useDispatch } from "react-redux";

import WaveformBars from "./WaveformBars";
import {
  selectIsPlaying,
  togglePlay,
} from "@/features/interface/audio-player/AudioPlayer.slice";

function HeadersSection({ title, icon: Icon, songName }) {
  const isPlaying = useSelector(selectIsPlaying);
  const dispatch = useDispatch();

  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b"
      style={{
        borderColor: "var(--border)",
        background: "var(--card)",
        animation: "fadeSlideIn 0.35s ease forwards",
      }}
    >
      {/* Left — icon badge + title */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {/* Icon badge: amber primary bg, dark text on it */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--primary)" }}
          >
            <Icon size={16} style={{ color: "var(--primary-foreground)" }} />
          </div>

          {/* Pulse ring when playing */}
          {isPlaying && (
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                animation: "pulse-ring 1.5s ease-out infinite",
                border: "2px solid var(--primary)",
              }}
            />
          )}
        </div>

        <div>
          <h1
            className="text-sm font-bold shimmer-text"
            style={{
              letterSpacing: "0.06em",
              color: "var(--foreground)",
            }}
          >
            {title}
          </h1>
          <p
            className="text-[10px]"
            style={{ color: "var(--muted-foreground)" }}
          >
            {songName}
          </p>
        </div>
      </div>

      {/* Right — waveform + play button */}
      <div className="flex items-center gap-4">
        <WaveformBars />

        <button
          onClick={() => dispatch(togglePlay())}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
          style={{
            background: isPlaying
              ? "color-mix(in oklch, var(--primary) 15%, transparent)"
              : "transparent",
            borderColor: "color-mix(in oklch, var(--primary) 45%, transparent)",
            color: "var(--primary)",
          }}
        >
          {isPlaying ? "■ Stop" : "▶ Play"}
        </button>
      </div>
    </div>
  );
}

export default HeadersSection;
