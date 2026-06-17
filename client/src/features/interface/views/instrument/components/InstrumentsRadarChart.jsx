import React from "react";
import ChartRadarDots from "./ChartRadarDots";
import { AudioWaveform } from "lucide-react";

function InstrumentsRadarChart({ resultId, topPredictions, totalCandidates }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AudioWaveform className="h-4 w-4 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Tonal Fingerprint
          </span>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-mono text-muted-foreground">
          {totalCandidates} axes
        </span>
      </div>
      <div className="w-full h-[500px]">
        <ChartRadarDots
          key={`chart-${resultId}`}
          instruments={topPredictions}
        />
      </div>
    </div>
  );
}

export default InstrumentsRadarChart;
