import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChartRadarDots from "./ChartRadarDots";
import InstrumentTag from "../components/InstrumentTag";
import {
  Music2,
  AudioWaveform,
  Zap,
  Clock3,
  BarChart2,
  Layers,
  TrendingUp,
} from "lucide-react";

// ── animated counter ─────────────────────────────────────────────────────────
function CountUp({ to, decimals = 0, suffix = "", duration = 1200 }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(parseFloat((ease * to).toFixed(decimals)));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to]);

  return (
    <span>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ── shared tokens ────────────────────────────────────────────────────────────
const CARD_BG = "oklch(0.1469 0.0041 49.2499)";
const CARD_BORDER = "oklch(0.2684 0.0134 41.6416)";
const ACCENT = "oklch(0.829 0.1712 81.0381)";
const ACCENT2 = "oklch(0.7457 0.1649 65.0805)";
const MUTED = "oklch(0.42 0.02 81)";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.13, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

function capitalize(str) {
  return str?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── RightSection ─────────────────────────────────────────────────────────────
function RightSection({ result }) {
  const topPredictions = result?.results?.top_predictions ?? [];
  const detectedSet = new Set(result?.instruments ?? []);
  const threshold = result?.results?.threshold ?? 0.5;
  const totalDetected = result?.results?.total_detected ?? 0;
  const processingTime = result?.results?.processing_time_seconds ?? null;
  const totalCandidates = topPredictions.length;

  const confirmed = topPredictions.filter((p) => detectedSet.has(p.instrument));
  const lowConf = topPredictions.filter((p) => !detectedSet.has(p.instrument));
  const allForList = [...confirmed, ...lowConf];
  const dominant = confirmed[0] ?? null;
  const hasData = topPredictions.length > 0;

  const arcR = 28;
  const arcCirc = 2 * Math.PI * arcR;
  const arcOffset = dominant
    ? arcCirc * (1 - dominant.percentage / 100)
    : arcCirc;

  return (
    <div
      className="flex flex-col gap-4 p-5"
      style={{ width: "42%", minWidth: 0 }}
    >
      {/* ── 1. HERO — Top Detected Instrument ─────────────────────────────── */}
      <AnimatePresence>
        {dominant && (
          <motion.div
            key="hero"
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="show"
            whileHover={{ scale: 1.012, transition: { duration: 0.18 } }}
            className="rounded-2xl border overflow-hidden relative"
            style={{
              background: CARD_BG,
              borderColor: ACCENT,
              boxShadow: `0 0 32px oklch(0.829 0.1712 81.0381 / 0.12)`,
            }}
          >
            {/* glowing top bar */}
            <div
              style={{
                height: 3,
                background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2}, transparent)`,
              }}
            />

            {/* dot-grid texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, oklch(0.829 0.1712 81.0381 / 0.055) 1px, transparent 1px)`,
                backgroundSize: "18px 18px",
              }}
            />

            <div className="relative p-4 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Zap size={11} style={{ color: ACCENT }} />
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: ACCENT }}
                  >
                    Top Detected
                  </span>
                </div>
                <h2
                  className="text-2xl font-bold truncate"
                  style={{
                    color: "#f0ece0",
                    letterSpacing: "-0.02em",
                    textShadow: `0 0 28px oklch(0.829 0.1712 81.0381 / 0.45)`,
                  }}
                >
                  {capitalize(dominant.instrument)}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                  Highest confidence · above {(threshold * 100).toFixed(0)}%
                  threshold
                </p>
              </div>

              {/* confidence arc */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle
                    cx="36"
                    cy="36"
                    r={arcR}
                    fill="none"
                    stroke={CARD_BORDER}
                    strokeWidth="5"
                  />
                  <motion.circle
                    cx="36"
                    cy="36"
                    r={arcR}
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={arcCirc}
                    strokeDashoffset={arcCirc}
                    transform="rotate(-90 36 36)"
                    animate={{ strokeDashoffset: arcOffset }}
                    transition={{ duration: 1.3, ease: "easeOut", delay: 0.35 }}
                    style={{ filter: `drop-shadow(0 0 5px ${ACCENT})` }}
                  />
                  <text
                    x="36"
                    y="41"
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="700"
                    fontFamily="monospace"
                    fill={ACCENT}
                  >
                    {dominant.percentage.toFixed(0)}%
                  </text>
                </svg>
                <span className="text-xs" style={{ color: MUTED }}>
                  confidence
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. TONAL FINGERPRINT (Radar) ──────────────────────────────────── */}
      <motion.div
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        whileHover={{ scale: 1.007, transition: { duration: 0.18 } }}
        className="rounded-2xl border p-4 flex flex-col gap-2"
        style={{ background: CARD_BG, borderColor: CARD_BORDER }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AudioWaveform size={14} style={{ color: ACCENT }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: ACCENT }}
            >
              Tonal Fingerprint
            </span>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-mono"
            style={{
              background: "oklch(0.829 0.1712 81.0381 / 0.09)",
              color: MUTED,
            }}
          >
            {totalCandidates} axes
          </span>
        </div>

        <div className="w-full" style={{ height: "260px" }}>
          <ChartRadarDots instruments={topPredictions} />
        </div>
      </motion.div>

      {/* ── 3. STATS STRIP ────────────────────────────────────────────────── */}
      {hasData && (
        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="rounded-2xl border grid grid-cols-3 overflow-hidden"
          style={{ borderColor: CARD_BORDER, background: CARD_BG }}
        >
          {[
            {
              Icon: Clock3,
              label: "Process Time",
              value:
                processingTime != null ? (
                  <CountUp to={processingTime} decimals={2} suffix="s" />
                ) : (
                  "—"
                ),
            },
            {
              Icon: BarChart2,
              label: "Threshold",
              value: <CountUp to={threshold * 100} decimals={0} suffix="%" />,
            },
            {
              Icon: Layers,
              label: "Detected",
              value: <CountUp to={totalDetected} decimals={0} />,
            },
          ].map(({ Icon, label, value }, i) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 py-3 px-2"
              style={{
                borderRight: i < 2 ? `1px solid ${CARD_BORDER}` : "none",
              }}
            >
              <Icon size={12} style={{ color: MUTED }} />
              <span
                className="text-base font-bold font-mono tabular-nums"
                style={{ color: "#e5e5e5" }}
              >
                {value}
              </span>
              <span className="text-xs" style={{ color: MUTED }}>
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── 4. INSTRUMENT PRESENCE ────────────────────────────────────────── */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="rounded-2xl border p-4 flex flex-col gap-3"
        style={{ background: CARD_BG, borderColor: CARD_BORDER }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} style={{ color: ACCENT }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: ACCENT }}
            >
              Instrument Presence
            </span>
          </div>
          {totalDetected > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-mono"
              style={{
                background: "oklch(0.829 0.1712 81.0381 / 0.12)",
                color: ACCENT,
              }}
            >
              {totalDetected} detected
            </span>
          )}
        </div>

        {allForList.length > 0 ? (
          <>
            {/* confirmed */}
            <div className="flex flex-col gap-3">
              {confirmed.map((p, i) => (
                <motion.div
                  key={p.instrument}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.55 + i * 0.09,
                    duration: 0.35,
                    ease: "easeOut",
                  }}
                >
                  <InstrumentTag
                    label={p.instrument}
                    score={p.percentage}
                    detected={true}
                    delay="0s"
                  />
                </motion.div>
              ))}
            </div>

            {/* below-threshold divider + items */}
            {lowConf.length > 0 && (
              <>
                <div
                  className="flex items-center gap-2 pt-1"
                  style={{ color: MUTED }}
                >
                  <div
                    className="h-px flex-1"
                    style={{ background: CARD_BORDER }}
                  />
                  <span className="text-xs whitespace-nowrap">
                    below {(threshold * 100).toFixed(0)}% threshold
                  </span>
                  <div
                    className="h-px flex-1"
                    style={{ background: CARD_BORDER }}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  {lowConf.map((p, i) => (
                    <motion.div
                      key={p.instrument}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.6 + confirmed.length * 0.09 + i * 0.08,
                        duration: 0.35,
                        ease: "easeOut",
                      }}
                    >
                      <InstrumentTag
                        label={p.instrument}
                        score={p.percentage}
                        detected={false}
                        delay="0s"
                      />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <p className="text-xs" style={{ color: MUTED }}>
            No predictions available yet.
          </p>
        )}
      </motion.div>
    </div>
  );
}

export default RightSection;
