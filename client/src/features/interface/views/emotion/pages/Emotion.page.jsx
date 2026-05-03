// ============================================================
// FILE: src/app/projects/[projectId]/emotion/page.tsx
// FINAL PRODUCTION PAGE
// ============================================================

"use client";

import HeadersSection from "@/features/interface/components/HeadersSection";
import { Laugh, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { useEmotionAnalysis } from "@/features/interface/views/emotion/hooks/useEmotionAnalysis";
import { useParams } from "react-router";

export default function EmotionPage() {
  const params = useParams();
  const projectId = params?.id || "";

  const { loading, result, socket, query } = useEmotionAnalysis(projectId);

  const emotions = result?.prediction_result?.static?.emotions || {};

  const dominant = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barDance {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0;   }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg,
            oklch(0.829 0.1712 81.0381) 0%,
            oklch(0.92 0.18 95) 45%,
            oklch(0.829 0.1712 81.0381) 80%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>
      <div className="w-full min-h-screen px-6 pb-10">
        <HeadersSection
          title="EMOTIONAL ANALYSIS"
          icon={Laugh}
          songName="track_01_final_mix.wav · 4:23"
        />

        {/* ---------------- LOADER ---------------- */}
        {loading && (
          <div className="mt-10 max-w-4xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />

              <div>
                <h2 className="text-2xl font-semibold">Analyzing Track...</h2>

                <p className="text-zinc-400 text-sm">
                  Please wait while AI processes emotional data
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-yellow-400 to-pink-500 transition-all duration-300"
                  style={{
                    width: `${socket.progress}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-sm text-zinc-400">
                {socket.progress.toFixed(0)}%
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {socket.steps.map((step) => (
                <div
                  key={step.id}
                  className="rounded-2xl border border-white/10 px-4 py-3"
                >
                  <div className="flex justify-between">
                    <span>{step.name}</span>

                    {step.status === "completed" ? (
                      <CheckCircle2 className="text-emerald-400 h-5 w-5" />
                    ) : (
                      <Loader2 className="animate-spin h-5 w-5 text-yellow-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- ERROR ---------------- */}
        {(query.isError || socket.error) && !loading && (
          <div className="mt-10 max-w-3xl mx-auto rounded-3xl border border-red-500/20 bg-red-500/10 p-6 flex gap-3">
            <AlertCircle className="text-red-400" />
            <div>{socket.error || "Failed to load analysis"}</div>
          </div>
        )}

        {/* ---------------- RESULTS ---------------- */}
        {result && !loading && (
          <div className="mt-10 max-w-5xl mx-auto space-y-6">
            {/* Dominant Emotion */}
            {dominant && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <p className="text-zinc-400 text-sm uppercase">
                  Dominant Emotion
                </p>

                <h2 className="text-5xl font-bold capitalize mt-2">
                  {dominant[0]}
                </h2>

                <p className="text-zinc-400 mt-2">
                  Confidence: {(Number(dominant[1]) * 100).toFixed(1)}%
                </p>
              </div>
            )}

            {/* Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(emotions).map(([emotion, value]) => (
                <div
                  key={emotion}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex justify-between">
                    <span className="capitalize">{emotion}</span>

                    <span>{(value * 100).toFixed(1)}%</span>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-yellow-400 to-pink-500"
                      style={{
                        width: `${value * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic */}
            {result.prediction_result?.dynamic && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-xl font-semibold">Dynamic Timeline</h3>

                <p className="text-zinc-400 mt-2">
                  {result.prediction_result.dynamic.timestamps?.length} segments
                  analyzed
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
