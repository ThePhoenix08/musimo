import React from "react";
import { useSelector } from "react-redux";
import { selectIsPlaying } from "@/features/interface/audio-player/AudioPlayer.slice";

function WaveformBars() {
  const isPlaying = useSelector(selectIsPlaying);

  return (
    <div className="flex items-end gap-[2px] h-7">
      {Array.from({ length: 28 }, (_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            background: "oklch(0.829 0.1712 81.0381)",
            minHeight: "4px",
            opacity: 0.75,
            height: isPlaying ? `${30 + (i % 5) * 14}%` : "20%",
            animation: isPlaying
              ? `barDance ${0.4 + (i % 7) * 0.1}s ease-in-out infinite alternate`
              : "none",
            animationDelay: `${i * 0.04}s`,
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

export default WaveformBars;
