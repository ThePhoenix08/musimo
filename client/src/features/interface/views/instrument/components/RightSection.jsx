import React, { useEffect, useState } from "react";

import TopDetectedInstrumentCard from "./TopDetectedInstrumentCard";
import InstrumentsRadarChart from "./InstrumentsRadarChart";
import InstrumentalPresenceCard from "./InstrumentalPresenceCard";

function RightSection({ result }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) return null;

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        No analysis data available
      </div>
    );
  }

  const topPredictions = result?.results?.top_predictions ?? [];
  const detectedSet = new Set(result?.instruments ?? []);

  const threshold = result?.results?.threshold ?? 0.5;
  const totalDetected = result?.results?.total_detected ?? 0;

  const totalCandidates = topPredictions.length;
  const resultId = result?.id ?? "none";

  const confirmed = topPredictions.filter((p) => detectedSet.has(p.instrument));
  const lowConf = topPredictions.filter((p) => !detectedSet.has(p.instrument));
  const dominant = confirmed[0] ?? null;

  const arcR = 28;
  const arcCirc = 2 * Math.PI * arcR;

  return (
    <div className="flex-1 flex flex-col gap-4 p-5 min-w-0 overflow-y-auto">
      {dominant && (
        <TopDetectedInstrumentCard
          resultId={resultId}
          dominant={dominant}
          threshold={threshold}
          arcR={arcR}
          arcCirc={arcCirc}
        />
      )}

      <InstrumentsRadarChart
        resultId={resultId}
        topPredictions={topPredictions}
        totalCandidates={totalCandidates}
      />

      <InstrumentalPresenceCard
        resultId={resultId}
        totalDetected={totalDetected}
        confirmed={confirmed}
        lowConf={lowConf}
        threshold={threshold}
      />
    </div>
  );
}

export default RightSection;
