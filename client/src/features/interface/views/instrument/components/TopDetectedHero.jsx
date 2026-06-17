import { InstrumentIcon } from "../components/InstrumentsIcons";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

function capitalize(str) {
  return str?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function TopDetectedHero({ result }) {
  const topPredictions = result?.results?.top_predictions ?? [];
  const detectedSet = new Set(result?.instruments ?? []);
  const confirmed = topPredictions.filter((p) => detectedSet.has(p.instrument));
  const dominant = confirmed[0] ?? null;
  const threshold = result?.results?.threshold ?? 0.5;

  if (!dominant) return null;

  const arcR = 28;
  const arcCirc = 2 * Math.PI * arcR;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <p className="text-zinc-400 text-sm uppercase tracking-widest">
        Top Detected Instrument
      </p>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
            <InstrumentIcon name={dominant.instrument} size={30} />
          </div>
          <div>
            <h2 className="text-5xl font-bold capitalize">
              {capitalize(dominant.instrument)}
            </h2>
            <p className="text-zinc-400 mt-1">
              Confidence: {dominant.percentage.toFixed(1)}% · above{" "}
              {(threshold * 100).toFixed(0)}% threshold
            </p>
          </div>
        </div>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle
            cx="36"
            cy="36"
            r={arcR}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="5"
          />
          <motion.circle
            key={dominant.instrument}
            cx="36"
            cy="36"
            r={arcR}
            fill="none"
            stroke="oklch(0.829 0.1712 81.0381)"
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
            fill="oklch(0.829 0.1712 81.0381)"
          >
            {dominant.percentage.toFixed(0)}%
          </text>
        </svg>
      </div>
    </div>
  );
}

export default TopDetectedHero;
