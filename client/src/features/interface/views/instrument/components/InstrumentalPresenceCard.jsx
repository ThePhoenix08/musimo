import React from "react";
import { TrendingUp } from "lucide-react";
import InstrumentTag from "../components/InstrumentTag";

function InstrumentalPresenceCard({
  resultId,
  totalDetected,
  confirmed,
  lowConf,
  threshold,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Instrument Presence
          </span>
        </div>
        {totalDetected > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-mono text-primary">
            {totalDetected} detected
          </span>
        )}
      </div>

      {confirmed.length > 0 || lowConf.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {confirmed.map((p) => (
              <InstrumentTag
                key={`${resultId}-${p.instrument}`}
                label={p.instrument}
                score={p.percentage}
                detected={true}
                delay="0s"
              />
            ))}
          </div>
          {lowConf.length > 0 && (
            <>
              <div className="flex items-center gap-2 my-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-zinc-400 whitespace-nowrap">
                  below {(threshold * 100).toFixed(0)}% threshold
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="flex flex-col gap-3">
                {lowConf.map((p) => (
                  <InstrumentTag
                    key={`${resultId}-${p.instrument}`}
                    label={p.instrument}
                    score={p.percentage}
                    detected={false}
                    delay="0s"
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <p className="text-xs text-zinc-400">No predictions available yet.</p>
      )}
    </div>
  );
}

export default InstrumentalPresenceCard;
