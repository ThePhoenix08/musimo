import { useSelector } from "react-redux";

import {
  BarChart2,
  Loader2,
  AlertCircle,
} from "lucide-react";

import HeadersSection from "../../../components/HeadersSection";
import useFeatureAnalysis from "../hooks/useFeatureAnalysis";
import DashboardFeatures from "../components/dashboardfeatures";

export default function FeaturesPage() {
  // GET PROJECT FROM REDUX
  const project = useSelector(
    (state) => state.interface.project
  );

  const audioFileId =
    project?.data?.main_audio?.id;

  const {
    loading,
    result,
    dbQuery,
    extractionState,
  } = useFeatureAnalysis(audioFileId);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .shimmer-text {
          background: linear-gradient(
            90deg,
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

      <div
        className="w-full"
        style={{
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <HeadersSection
          title="FEATURE EXTRACTION"
          icon={BarChart2}
          songName="track_01_final_mix.wav · 4:23"
        />

        {/* ---------------- LOADING ---------------- */}

        {loading && (
          <div className="mt-10 max-w-3xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />

              <div>
                <h2 className="text-2xl font-semibold">
                  Extracting Audio Features...
                </h2>

                <p className="text-zinc-400 text-sm">
                  Processing spectral and harmonic data
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- ERROR ---------------- */}

        {(dbQuery.isError ||
          extractionState.isError) &&
          !loading && (
            <div className="mt-10 max-w-3xl mx-auto rounded-3xl border border-red-500/20 bg-red-500/10 p-6 flex gap-3">
              <AlertCircle className="text-red-400" />

              <div>
                Failed to load feature extraction
              </div>
            </div>
          )}

        {/* ---------------- RESULT ---------------- */}

        {result && !loading && (
          <DashboardFeatures data={result?.data || result} />
        )}
      </div>
    </>
  );
}