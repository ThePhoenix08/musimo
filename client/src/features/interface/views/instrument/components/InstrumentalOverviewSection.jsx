import React, { useEffect, useState } from "react";
import InstrumentsRadarChart from "./InstrumentsRadarChart";
import InstrumentalPresenceCard from "./InstrumentalPresenceCard";
import StatCard from "./StatCard";

function InstrumentalOverviewSection({ result, tab = "overview" }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted || !result) return null;

  const topPredictions = result?.results?.top_predictions ?? [];
  const detectedSet = new Set(result?.instruments ?? []);
  const threshold = result?.results?.threshold ?? 0.5;
  const totalDetected = result?.results?.total_detected ?? 0;
  const processingTime = result?.results?.processing_time_seconds ?? null;
  const totalCandidates = topPredictions.length;
  const resultId = result?.id ?? "none";
  const confirmed = topPredictions.filter((p) => detectedSet.has(p.instrument));
  const lowConf = topPredictions.filter((p) => !detectedSet.has(p.instrument));

  if (tab === "overview") {
    return (
      <div className="space-y-6">
        {/* Stats row — same pattern as emotion page stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Process Time"
            value={processingTime != null ? processingTime.toFixed(2) : "—"}
            unit="s"
            delay="0.1s"
          />
          <StatCard
            label="Threshold"
            value={(threshold * 100).toFixed(0)}
            unit="%"
            delay="0.2s"
          />
          <StatCard
            label="Detected"
            value={String(totalDetected)}
            unit="instruments"
            delay="0.3s"
          />
        </div>
        <InstrumentsRadarChart
          resultId={resultId}
          topPredictions={topPredictions}
          totalCandidates={totalCandidates}
        />
      </div>
    );
  }

  if (tab === "presence") {
    return (
      <InstrumentalPresenceCard
        resultId={resultId}
        totalDetected={totalDetected}
        confirmed={confirmed}
        lowConf={lowConf}
        threshold={threshold}
      />
    );
  }

  return null;
}

export default InstrumentalOverviewSection;
