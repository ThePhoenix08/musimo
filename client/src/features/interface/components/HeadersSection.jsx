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
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{
        borderColor: "oklch(0.2684 0.0134 41.6416)",
        background: "oklch(0.1465 0.0057 69.1979)",
        animation: "fadeSlideIn 0.35s ease forwards",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.829 0.1712 81.0381)" }}
          >
            {
              <Icon
                size={16}
                style={{ color: "oklch(0.1469 0.0041 49.2499)" }}
              />
            }
          </div>
          {isPlaying && (
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                animation: "pulse-ring 1.5s ease-out infinite",
                border: "2px solid oklch(0.829 0.1712 81.0381)",
              }}
            />
          )}
        </div>
        <div>
          <h1
            className="text-sm font-bold shimmer-text"
            style={{ letterSpacing: "0.06em" }}
          >
            {title}
          </h1>
          <p
            className="text-[10px]"
            style={{ color: "oklch(0.7312 0.0102 93.609)" }}
          >
            {songName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <WaveformBars />
        <button
          onClick={() => dispatch(togglePlay())}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
          style={{
            background: isPlaying
              ? "oklch(0.829 0.1712 81.0381 / 0.15)"
              : "transparent",
            borderColor: "oklch(0.829 0.1712 81.0381 / 0.45)",
            color: "oklch(0.829 0.1712 81.0381)",
          }}
        >
          {isPlaying ? "■ Stop" : "▶ Play"}
        </button>
      </div>
    </div>
  );
}

export default HeadersSection;
