import React from "react";
import ChartRadarDots from "./ChartRadarDots";
import InstrumentTag from "../components/InstrumentTag";
import { Guitar, Drum, Piano, Mic2, Music2, AudioWaveform } from "lucide-react";

function RightSection() {
  const instruments = [
    {
      Icon: Guitar,
      label: "Guitar",
      score: 87,
      color: "oklch(0.829 0.1712 81.0381)",
    },
    {
      Icon: Drum,
      label: "Drums",
      score: 72,
      color: "oklch(0.7457 0.1649 65.0805)",
    },
    {
      Icon: Piano,
      label: "Keys",
      score: 64,
      color: "oklch(0.8951 0.1506 104.0825)",
    },
    {
      Icon: Mic2,
      label: "Vocals",
      score: 91,
      color: "oklch(0.6746 0.1682 44.5846)",
    },
    {
      Icon: Music2,
      label: "Bass",
      score: 58,
      color: "oklch(0.5889 0.0954 82.222)",
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-5" style={{ width: "42%" }}>
      <div
        className="rounded-2xl border p-4 flex flex-col gap-2"
        style={{
          background: "oklch(0.1469 0.0041 49.2499)",
          borderColor: "oklch(0.2684 0.0134 41.6416)",
          animation: "fadeSlideIn 0.5s ease 0.2s forwards",
          opacity: 0,
        }}
      >
        <div className="flex items-center gap-2">
          <AudioWaveform
            size={14}
            style={{ color: "oklch(0.829 0.1712 81.0381)" }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "oklch(0.829 0.1712 81.0381)" }}
          >
            Characteristic Profile
          </span>
        </div>
        <div className="w-full" style={{ height: "260px" }}>
          <ChartRadarDots />
        </div>
      </div>

      {/* Instrument presence */}
      <div
        className="rounded-2xl border p-4 flex flex-col gap-3"
        style={{
          background: "oklch(0.1469 0.0041 49.2499)",
          borderColor: "oklch(0.2684 0.0134 41.6416)",
          animation: "fadeSlideIn 0.5s ease 0.4s forwards",
          opacity: 0,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Music2 size={14} style={{ color: "oklch(0.829 0.1712 81.0381)" }} />
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "oklch(0.829 0.1712 81.0381)" }}
          >
            Instrument Presence
          </span>
        </div>
        {instruments.map((inst, i) => (
          <InstrumentTag
            key={inst.label}
            {...inst}
            delay={`${0.55 + i * 0.08}s`}
          />
        ))}
      </div>
    </div>
  );
}

export default RightSection;
