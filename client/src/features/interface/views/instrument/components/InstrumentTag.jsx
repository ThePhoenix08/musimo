import {
  AudioWaveform,
  Drum,
  Guitar,
  Mic2,
  Music2,
  Piano,
  Radio,
  Waves,
  Disc3,
  Music4,
  Speaker,
  Volume2,
} from "lucide-react";

// Map instrument names → lucide icon + oklch color
const INSTRUMENT_CONFIG = {
  accordion: {
    Icon: Music4,
    color: "oklch(0.82 0.16 80)",
  },

  banjo: {
    Icon: Music2,
    color: "oklch(0.7457 0.1649 65.0805)",
  },

  bass: {
    Icon: Speaker ,
    color: "oklch(0.7457 0.1649 65.0805)",
  },

  cello: {
    Icon: AudioWaveform,
    color: "oklch(0.72 0.15 45)",
  },

  clarinet: {
    Icon: Waves,
    color: "oklch(0.67 0.16 44)",
  },

  cymbals: {
    Icon: Disc3,
    color: "oklch(0.78 0.17 90)",
  },

  drums: {
    Icon: Drum,
    color: "oklch(0.7457 0.1649 65.0805)",
  },

  flute: {
    Icon: Waves,
    color: "oklch(0.8951 0.1506 104.0825)",
  },

  guitar: {
    Icon: Guitar,
    color: "oklch(0.829 0.1712 81.0381)",
  },

  mallet_percussion: {
    Icon: Drum,
    color: "oklch(0.7 0.1 81)",
  },

  mandolin: {
    Icon: Music2,
    color: "oklch(0.829 0.1712 81.0381)",
  },

  organ: {
    Icon: Speaker,
    color: "oklch(0.83 0.13 120)",
  },

  piano: {
    Icon: Piano,
    color: "oklch(0.8951 0.1506 104.0825)",
  },

  saxophone: {
    Icon: Waves,
    color: "oklch(0.6746 0.1682 44.5846)",
  },

  synthesizer: {
    Icon: Music4,
    color: "oklch(0.78 0.18 280)",
  },

  trombone: {
    Icon: Radio,
    color: "oklch(0.73 0.17 70)",
  },

  trumpet: {
    Icon: Radio,
    color: "oklch(0.7457 0.1649 65.0805)",
  },

  ukulele: {
    Icon: Music2,
    color: "oklch(0.8951 0.1506 104.0825)",
  },

  violin: {
    Icon: AudioWaveform,
    color: "oklch(0.75 0.16 55)",
  },

  voice: {
    Icon: Mic2,
    color: "oklch(0.6746 0.1682 44.5846)",
  },
};

const FALLBACK = { Icon: Music2, color: "oklch(0.829 0.1712 81.0381)" };

function getConfig(name) {
  return INSTRUMENT_CONFIG[name?.toLowerCase()] ?? FALLBACK;
}

function capitalize(str) {
  return str?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function InstrumentTag({ label, score, detected = true, delay = "0s" }) {
  const { Icon, color } = getConfig(label);

  const activeColor = detected ? color : "oklch(0.48 0.02 81)";
  const trackBg = detected
    ? `${color.replace(")", " / 0.15)").replace("oklch(", "oklch(")}`
    : "oklch(0.25 0.01 49 / 0.6)";
  const labelColor = detected ? "#e5e5e5" : "oklch(0.48 0.02 81)";

  return (
    <div
      style={{
        animation: `fadeSlideIn 0.4s ease ${delay} both`,
        opacity: 0,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: activeColor, flexShrink: 0 }} />
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
        style={{ height: 5, background: trackBg }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: detected
              ? `linear-gradient(90deg, ${color}, oklch(0.75 0.15 55))`
              : activeColor,
          }}
        />
      </div>
    </div>
  );
}

export default InstrumentTag;
