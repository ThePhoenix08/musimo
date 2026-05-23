import React from "react";
import { InstrumentIcon } from "./InstrumentsIcons";

const INSTRUMENT_CONFIG = {
  accordion: { color: "var(--chart-1)" },
  banjo: { color: "var(--chart-3)" },
  bass: { color: "var(--chart-5)" },
  cello: { color: "var(--accent-foreground)" },
  clarinet: { color: "var(--chart-4)" },
  cymbals: { color: "var(--chart-2)" },
  drums: { color: "var(--muted-foreground)" },
  flute: { color: "var(--chart-1)" },
  guitar: { color: "var(--chart-3)" },
  mallet_percussion: { color: "var(--chart-2)" },
  mandolin: { color: "var(--chart-4)" },
  organ: { color: "var(--accent-foreground)" },
  piano: { color: "var(--chart-5)" },
  saxophone: { color: "var(--chart-1)" },
  synthesizer: { color: "var(--secondary-foreground)" },
  trombone: { color: "var(--chart-2)" },
  trumpet: { color: "var(--chart-3)" },
  ukulele: { color: "var(--chart-4)" },
  violin: { color: "var(--chart-5)" },
  voice: { color: "var(--foreground)" },
};

const FALLBACK = {
  color: "var(--muted-foreground)",
};

function getConfig(name) {
  return INSTRUMENT_CONFIG[name?.toLowerCase()] ?? FALLBACK;
}

function capitalize(str) {
  return str?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function InstrumentTag({
  label,
  score,
  detected = true,
  delay = "0s",
}) {
  const { color } = getConfig(label);

  const activeColor = detected ? color : "var(--muted-foreground)";

  const trackBg = detected
    ? "color-mix(in oklch, var(--accent) 18%, transparent)"
    : "color-mix(in oklch, var(--muted) 40%, transparent)";

  const labelColor = detected ? "var(--foreground)" : "var(--muted-foreground)";

  return (
    <div
      style={{
        animation: `fadeSlideIn 0.4s ease ${delay} both`,
        opacity: 0,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <InstrumentIcon name={label} size={14} muted={!detected} />

          <span
            className="text-sm font-medium capitalize"
            style={{ color: labelColor }}
          >
            {capitalize(label)}
          </span>
        </div>

        <span
          className="text-xs font-mono tabular-nums"
          style={{ color: activeColor }}
        >
          {score.toFixed(1)}%
        </span>
      </div>

      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: 5,
          background: trackBg,
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: detected ? activeColor : "var(--muted-foreground)",
          }}
        />
      </div>
    </div>
  );
}
