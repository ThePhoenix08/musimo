import React from "react";
import MotionCard from "./MotionCard";
import { TrendingUp } from "lucide-react";

import { CardContent } from "@/components/ui/card";
import InstrumentTag from "../components/InstrumentTag";
import { InstrumentIcon } from "./InstrumentsIcons";

function InstrumentalPresenceCard({
  resultId,
  totalDetected,
  confirmed,
  lowConf,
  threshold,
}) {
  return (
    <div>
      <MotionCard key={`presence-${resultId}`} index={3}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
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
              {/* ── Confirmed (above threshold) ── */}
              <div className="flex flex-col gap-3">
                {confirmed.map((p) => (
                  <InstrumentTag
                    key={`${resultId}-${p.instrument}`}
                    label={p.instrument}
                    score={p.percentage}
                    detected={true}
                    delay="0s"
                    icon={
                      <InstrumentIcon
                        name={p.instrument}
                        size={16}
                        className="text-primary shrink-0"
                      />
                    }
                  />
                ))}
              </div>

              {/* ── Below-threshold divider ── */}
              {lowConf.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      below {(threshold * 100).toFixed(0)}% threshold
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="flex flex-col gap-3">
                    {lowConf.map((p) => (
                      <InstrumentTag
                        key={`${resultId}-${p.instrument}`}
                        label={p.instrument}
                        score={p.percentage}
                        detected={false}
                        delay="0s"
                        icon={
                          <InstrumentIcon
                            name={p.instrument}
                            size={16}
                            className="text-muted-foreground shrink-0"
                          />
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              No predictions available yet.
            </p>
          )}
        </CardContent>
      </MotionCard>
    </div>
  );
}

export default InstrumentalPresenceCard;
