import React from "react";

function InstrumentTag({ Icon, label, score, color, delay }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl border"
      style={{
        borderColor: "oklch(0.2684 0.0134 41.6416)",
        background: "oklch(0.2103 0.0059 285.8852 / 0.5)",
        animation: `fadeSlideIn 0.5s ease forwards`,
        animationDelay: delay,
        opacity: 0,
      }}
    >
      <Icon size={14} style={{ color }} />
      <span
        className="text-xs font-medium"
        style={{ color: "oklch(0.8884 0.0042 91.45)" }}
      >
        {label}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <div
          className="w-16 h-1.5 rounded-full"
          style={{ background: "oklch(0.2366 0.011 48.2347)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${score}%`,
              background: color,
              transition: "width 1.5s ease",
            }}
          />
        </div>
        <span
          className="text-xs w-5 text-right"
          style={{ color: "oklch(0.7312 0.0102 93.609)" }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

export default InstrumentTag;
