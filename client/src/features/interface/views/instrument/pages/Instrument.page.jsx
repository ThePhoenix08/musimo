import { Guitar } from "lucide-react";
import { useParams } from "react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useSelector } from "react-redux";

import HeadersSection from "../../../components/HeadersSection";
import InstrumentalOverviewSection from "../components/InstrumentalOverviewSection";
import AiSummarySection from "../components/AiSummarySection";
import useInstrumentAnalysis from "../hooks/useInstrumentAnalysis";
import TopDetectedHero from "../components/TopDetectedHero";
import {
  selectAudioName,
  selectDuration,
} from "@/features/interface/audio-player/AudioPlayer.slice";

const fmt = (s) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function InstrumentPage() {
  const params = useParams();
  const projectId = params?.id || "";
  const audioName = useSelector(selectAudioName);
  const audioDuration = useSelector(selectDuration);
  const { loading, result, socket, dbQuery } = useInstrumentAnalysis(projectId);

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

      <div className="w-full" style={{ fontFamily: "system-ui, sans-serif" }}>
        <HeadersSection
          title="INSTRUMENTAL ANALYSIS"
          icon={Guitar}
          songName={`${audioName} · ${fmt(audioDuration)}`}
        />

        {loading && (
          <div className="mt-10 max-w-4xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
              <div>
                <h2 className="text-2xl font-semibold">Analyzing Track...</h2>
                <p className="text-zinc-400 text-sm">
                  Please wait while AI processes instrumental data
                </p>
              </div>
            </div>
            <div className="mt-6">
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-yellow-400 to-pink-500 transition-all duration-300"
                  style={{ width: `${socket.progress}%` }}
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

        {(dbQuery.isError || socket.error) && !loading && (
          <div className="mt-10 max-w-3xl mx-auto rounded-3xl border border-red-500/20 bg-red-500/10 p-6 flex gap-3">
            <AlertCircle className="text-red-400" />
            <div>{socket.error || "Failed to load analysis"}</div>
          </div>
        )}

        {result && !loading && (
          <div key={result.id} className="mt-10 max-w-6xl mx-auto space-y-6">
            <TopDetectedHero result={result} />

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-white/10 rounded-none p-0 h-auto gap-8">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-400 data-[state=active]:bg-transparent px-0 py-3"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="presence"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-400 data-[state=active]:bg-transparent px-0 py-3"
                >
                  Instrument Presence
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-400 data-[state=active]:bg-transparent px-0 py-3"
                >
                  AI Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <InstrumentalOverviewSection result={result} tab="overview" />
              </TabsContent>

              <TabsContent value="presence" className="mt-6">
                <InstrumentalOverviewSection result={result} tab="presence" />
              </TabsContent>

              <TabsContent value="summary" className="mt-6">
                <AiSummarySection summary={result.summary} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
