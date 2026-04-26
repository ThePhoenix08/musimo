import React from "react";

function WaveformBars({ playing }) {
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
            height: playing ? `${30 + (i % 5) * 14}%` : "20%",
            animation: playing
              ? `barDance ${0.4 + (i % 7) * 0.1}s ease-in-out infinite alternate`
              : "none",
            animationDelay: `${i * 0.04}s`,
          }}
        />
      ))}
    </div>
  );
}

export default WaveformBars;
