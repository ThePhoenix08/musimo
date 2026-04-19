import React from "react";

function StatCard({ label, value, unit, delay }) {
  return (
    <div>
      <div
        className="rounded-2xl p-4 border flex flex-col gap-1"
        style={{
          background: "oklch(0.1469 0.0041 49.2499)",
          borderColor: "oklch(0.2684 0.0134 41.6416)",
          animation: `fadeSlideIn 0.5s ease forwards`,
          animationDelay: delay,
          opacity: 0,
        }}
      >
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: "oklch(0.7312 0.0102 93.609)" }}
        >
          {label}
        </span>
        <div className="flex items-end gap-1">
          <span
            className="text-2xl font-bold"
            style={{
              color: "oklch(0.829 0.1712 81.0381)",
              fontFamily: "Georgia, serif",
            }}
          >
            {value}
          </span>
          <span
            className="text-xs mb-1"
            style={{ color: "oklch(0.7312 0.0102 93.609)" }}
          >
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

export default StatCard;
