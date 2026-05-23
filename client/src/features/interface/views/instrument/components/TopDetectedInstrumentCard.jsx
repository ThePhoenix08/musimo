import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

import { CardContent } from "@/components/ui/card";
import { InstrumentIcon } from "./InstrumentsIcons";
import MotionCard from "./MotionCard";

function capitalize(str) {
  return str?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function TopDetectedInstrumentCard({
  resultId,
  dominant,
  threshold,
  arcR,
  arcCirc,
}) {
  return (
    <div>
      <MotionCard
        key={`hero-${resultId}`}
        index={0}
        className="overflow-hidden border-primary/30 bg-card"
      >
        <div className="h-[3px] bg-gradient-to-r from-primary via-yellow-400 to-transparent" />

        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Top Detected
              </span>
            </div>

            {/* Instrument name + icon side-by-side */}
            <div className="flex items-center gap-3">
              {/* Icon badge */}
              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                <InstrumentIcon name={dominant.instrument} size={22} />
              </div>

              <h2 className="text-2xl font-bold truncate">
                {capitalize(dominant.instrument)}
              </h2>
            </div>

            <p className="text-xs text-muted-foreground">
              Highest confidence · above {(threshold * 100).toFixed(0)}%
              threshold
            </p>
          </div>

          {/* Circular confidence arc */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle
                cx="36"
                cy="36"
                r={arcR}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="5"
              />
              <motion.circle
                key={`arc-${resultId}`}
                cx="36"
                cy="36"
                r={arcR}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={arcCirc}
                initial={{ strokeDashoffset: arcCirc }}
                animate={{
                  strokeDashoffset: arcCirc * (1 - dominant.percentage / 100),
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                transform="rotate(-90 36 36)"
              />
              <text
                x="36"
                y="41"
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill="currentColor"
                className="fill-primary"
              >
                {dominant.percentage.toFixed(0)}%
              </text>
            </svg>
            <span className="text-xs text-muted-foreground">confidence</span>
          </div>
        </CardContent>
      </MotionCard>
    </div>
  );
}

export default TopDetectedInstrumentCard;
