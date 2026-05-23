import React from "react";
import { motion } from "framer-motion";
import MotionCard from "./MotionCard";

import { CardContent } from "@/components/ui/card";
import ChartRadarDots from "./ChartRadarDots";
import { AudioWaveform } from "lucide-react";

function InstrumentsRadarChart({ resultId, topPredictions, totalCandidates }) {
  return (
    <div>
      <MotionCard key={`radar-${resultId}`} index={1}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
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

          <div className="w-full h-[260px] min-h-[260px]">
            <ChartRadarDots
              key={`chart-${resultId}`}
              instruments={topPredictions}
            />
          </div>
        </CardContent>
      </MotionCard>
    </div>
  );
}

export default InstrumentsRadarChart;
