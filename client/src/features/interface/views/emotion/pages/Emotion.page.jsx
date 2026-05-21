// ============================================================
// FILE: src/app/projects/[projectId]/emotion/page.tsx
// FINAL PRODUCTION PAGE WITH RADAR CHARTS & SUMMARY
// ============================================================

"use client";

import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import HeadersSection from "@/features/interface/components/HeadersSection";
import {
  Laugh,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from "recharts";

import { useEmotionAnalysis } from "@/features/interface/views/emotion/hooks/useEmotionAnalysis";
import { useParams } from "react-router";
import {
  selectCurrentTime,
  selectDuration,
  selectIsPlaying,
  setEmotionSegments,
} from "@/features/interface/audio-player/AudioPlayer.slice";
import { useEffect } from "react";

// Emotion colors for radar charts
const EMOTION_COLORS = {
  Wonder: "#fbbf24",
  Transcendence: "#a78bfa",
  Tenderness: "#f472b6",
  Nostalgia: "#60a5fa",
  Peacefulness: "#34d399",
  Power: "#f87171",
  "Joyful Activation": "#fcd34d",
  Tension: "#fb7185",
  Sadness: "#94a3b8",
};

// Map GEMS emotion names to audio player slice keys (lowercase)
const EMOTION_KEY_MAP = {
  Wonder: "wonder",
  Transcendence: "power", // No transcendence in GES, map to power
  Tenderness: "tenderness",
  Nostalgia: "joy", // Map to joy as closest equivalent
  Peacefulness: "peacefulness",
  Power: "power",
  "Joyful Activation": "joy",
  Tension: "tension",
  Sadness: "sadness",
};

const chartConfig = {
  Wonder: {
    label: "Wonder",
    color: EMOTION_COLORS.Wonder,
  },
  Transcendence: {
    label: "Transcendence",
    color: EMOTION_COLORS.Transcendence,
  },
  Tenderness: {
    label: "Tenderness",
    color: EMOTION_COLORS.Tenderness,
  },
  Nostalgia: {
    label: "Nostalgia",
    color: EMOTION_COLORS.Nostalgia,
  },
  Peacefulness: {
    label: "Peacefulness",
    color: EMOTION_COLORS.Peacefulness,
  },
  Power: {
    label: "Power",
    color: EMOTION_COLORS.Power,
  },
  "Joyful Activation": {
    label: "Joyful Activation",
    color: EMOTION_COLORS["Joyful Activation"],
  },
  Tension: {
    label: "Tension",
    color: EMOTION_COLORS.Tension,
  },
  Sadness: {
    label: "Sadness",
    color: EMOTION_COLORS.Sadness,
  },
};

function StaticRadarChart({ emotions }) {
  const data = [
    {
      emotion: "Wonder",
      value: (emotions?.Wonder || 0) * 100,
      fullMark: 100,
    },
    {
      emotion: "Transcendence",
      value: (emotions?.Transcendence || 0) * 100,
      fullMark: 100,
    },
    {
      emotion: "Tenderness",
      value: (emotions?.Tenderness || 0) * 100,
      fullMark: 100,
    },
    {
      emotion: "Nostalgia",
      value: (emotions?.Nostalgia || 0) * 100,
      fullMark: 100,
    },
    {
      emotion: "Peacefulness",
      value: (emotions?.Peacefulness || 0) * 100,
      fullMark: 100,
    },
    {
      emotion: "Power",
      value: (emotions?.Power || 0) * 100,
      fullMark: 100,
    },
    {
      emotion: "Joyful Activation",
      value: (emotions?.["Joyful Activation"] || 0) * 100,
      fullMark: 100,
    },
    {
      emotion: "Tension",
      value: (emotions?.Tension || 0) * 100,
      fullMark: 100,
    },
    {
      emotion: "Sadness",
      value: (emotions?.Sadness || 0) * 100,
      fullMark: 100,
    },
  ];

  return (
    <ChartContainer config={chartConfig} className="h-[400px]">
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis dataKey="emotion" tick={{ fill: "#9ca3af" }} />
        <Radar
          name="Confidence"
          dataKey="value"
          stroke={EMOTION_COLORS.Peacefulness}
          fill={EMOTION_COLORS.Peacefulness}
          fillOpacity={0.3}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
      </RadarChart>
    </ChartContainer>
  );
}

function DynamicRadarChart({ emotions, timestamps, currentTimestamp }) {
  const closestIndex = useMemo(() => {
    if (!timestamps) return 0;
    let closest = 0;
    let minDiff = Math.abs(timestamps[0] - currentTimestamp);
    for (let i = 1; i < timestamps.length; i++) {
      const diff = Math.abs(timestamps[i] - currentTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    return closest;
  }, [timestamps, currentTimestamp]);

  const currentEmotions = useMemo(() => {
    return {
      Wonder: emotions?.Wonder?.[closestIndex] || 0,
      Transcendence: emotions?.Transcendence?.[closestIndex] || 0,
      Tenderness: emotions?.Tenderness?.[closestIndex] || 0,
      Nostalgia: emotions?.Nostalgia?.[closestIndex] || 0,
      Peacefulness: emotions?.Peacefulness?.[closestIndex] || 0,
      Power: emotions?.Power?.[closestIndex] || 0,
      "Joyful Activation": emotions?.["Joyful Activation"]?.[closestIndex] || 0,
      Tension: emotions?.Tension?.[closestIndex] || 0,
      Sadness: emotions?.Sadness?.[closestIndex] || 0,
    };
  }, [emotions, closestIndex]);

  const data = [
    {
      emotion: "Wonder",
      value: currentEmotions.Wonder * 100,
      fullMark: 100,
    },
    {
      emotion: "Transcendence",
      value: currentEmotions.Transcendence * 100,
      fullMark: 100,
    },
    {
      emotion: "Tenderness",
      value: currentEmotions.Tenderness * 100,
      fullMark: 100,
    },
    {
      emotion: "Nostalgia",
      value: currentEmotions.Nostalgia * 100,
      fullMark: 100,
    },
    {
      emotion: "Peacefulness",
      value: currentEmotions.Peacefulness * 100,
      fullMark: 100,
    },
    {
      emotion: "Power",
      value: currentEmotions.Power * 100,
      fullMark: 100,
    },
    {
      emotion: "Joyful Activation",
      value: currentEmotions["Joyful Activation"] * 100,
      fullMark: 100,
    },
    {
      emotion: "Tension",
      value: currentEmotions.Tension * 100,
      fullMark: 100,
    },
    {
      emotion: "Sadness",
      value: currentEmotions.Sadness * 100,
      fullMark: 100,
    },
  ];

  return (
    <ChartContainer config={chartConfig} className="h-[400px]">
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis dataKey="emotion" tick={{ fill: "#9ca3af" }} />
        <Radar
          name="Confidence"
          dataKey="value"
          stroke={EMOTION_COLORS["Joyful Activation"]}
          fill={EMOTION_COLORS["Joyful Activation"]}
          fillOpacity={0.4}
          animationDuration={150}
          isAnimationActive={true}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
      </RadarChart>
    </ChartContainer>
  );
}

export default function EmotionPage() {
  const dispatch = useDispatch();
  const params = useParams();
  const projectId = params?.id || "";

  const { loading, result, socket, query } = useEmotionAnalysis(projectId);

  // Get current playback time from audio player Redux state
  const currentTime = useSelector(selectCurrentTime);
  const duration = useSelector(selectDuration);
  const isPlaying = useSelector(selectIsPlaying);

  const emotions = result?.prediction_result?.static?.emotions || {};
  const dynamicData = result?.prediction_result?.dynamic;
  const summary = result?.summary;

  const dominant = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];

  // Memoized emotion segments processing from dynamic timestamp confidence scores
  const processedEmotionSegments = useMemo(() => {
    if (!dynamicData?.emotions || !dynamicData?.timestamps) return [];

    const timestamps = dynamicData.timestamps;
    const emotionData = dynamicData.emotions;
    const segments = [];

    // Define confidence threshold for segment boundaries
    const CONFIDENCE_THRESHOLD = 0.15;

    // Process each timestamp to find dominant emotion
    for (let i = 0; i < timestamps.length; i++) {
      const emotionScores = {};

      // Get emotion scores at this timestamp
      Object.entries(emotionData).forEach(([emotion, values]) => {
        if (Array.isArray(values) && values[i] !== undefined) {
          emotionScores[emotion] = values[i];
        }
      });

      // Find dominant emotion
      const dominantEntry = Object.entries(emotionScores).sort(
        (a, b) => b[1] - a[1]
      )[0];

      if (!dominantEntry) continue;

      const [dominantEmotion, confidence] = dominantEntry;
      const emotionKey = EMOTION_KEY_MAP[dominantEmotion];
      const currentTime = timestamps[i];

      // Check if we should start a new segment or continue existing one
      if (
        segments.length === 0 ||
        segments[segments.length - 1].emotion !== emotionKey ||
        segments[segments.length - 1].confidence < confidence - CONFIDENCE_THRESHOLD
      ) {
        // Start new segment or merge if confidence is similar
        if (segments.length > 0) {
          segments[segments.length - 1].endTime = currentTime;
        }

        segments.push({
          startTime: currentTime,
          endTime: currentTime,
          emotion: emotionKey,
          confidence: confidence,
        });
      } else {
        // Update end time of current segment
        segments[segments.length - 1].endTime = currentTime;
        // Update confidence with average
        const lastSegment = segments[segments.length - 1];
        lastSegment.confidence =
          (lastSegment.confidence + confidence) / 2;
      }
    }

    return segments;
  }, [dynamicData?.emotions, dynamicData?.timestamps]);

  // Dispatch emotion segments to audio player when processed segments change
  useEffect(() => {
    if (processedEmotionSegments.length > 0) {
      dispatch(setEmotionSegments(processedEmotionSegments));
    }
  }, [processedEmotionSegments, dispatch]);

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
          title="EMOTIONAL ANALYSIS"
          icon={Laugh}
          songName="track_01_final_mix.wav · 4:23"
        />

        {/* LOADER */}
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
                  className="h-full bg-gradient-to-r from-yellow-400 to-pink-500 transition-all duration-300"
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

        {/* ERROR */}
        {(query.isError || socket.error) && !loading && (
          <div className="mt-10 max-w-3xl mx-auto rounded-3xl border border-red-500/20 bg-red-500/10 p-6 flex gap-3">
            <AlertCircle className="text-red-400" />
            <div>{socket.error || "Failed to load analysis"}</div>
          </div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <div className="mt-10 max-w-6xl mx-auto space-y-6">
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

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-white/10 rounded-none p-0 h-auto gap-8">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-400 data-[state=active]:bg-transparent px-0 py-3"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="dynamic"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-400 data-[state=active]:bg-transparent px-0 py-3"
                >
                  Timeline Analysis
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-400 data-[state=active]:bg-transparent px-0 py-3"
                >
                  AI Summary
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Static Radar Chart */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                  <h3 className="text-2xl font-semibold mb-6">
                    Overall Emotional Profile
                  </h3>
                  <StaticRadarChart emotions={emotions} />
                </div>

                {/* Emotion Cards Grid */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Object.entries(emotions).map(([emotion, value]) => (
                    <div
                      key={emotion}
                      className="rounded-3xl border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex justify-between">
                        <span className="capitalize">{emotion}</span>
                        <span className="font-semibold">
                          {(value * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-pink-500"
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Dynamic Tab */}
              <TabsContent value="dynamic" className="space-y-6">
                {dynamicData && (
                  <>
                    {/* Dynamic Radar Chart - Synced with Audio Player */}
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-semibold">
                          Emotional Profile: {currentTime.toFixed(2)}s
                        </h3>
                        <span className="text-sm text-zinc-400">
                          {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 mb-6">
                        {isPlaying
                          ? "Playing - Graph updates in real-time"
                          : "Use the audio player to control playback"}
                      </p>
                      <DynamicRadarChart
                        emotions={dynamicData.emotions}
                        timestamps={dynamicData.timestamps}
                        currentTimestamp={currentTime}
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-6">
                {summary && (
                  <>
                    {/* Overall Summary */}
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                      <div className="flex gap-6">
                        <div className="flex-1">
                          <h3 className="text-3xl font-bold mb-2">
                            {summary.overall_summary?.title}
                          </h3>
                          <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                            {summary.overall_summary?.summary}
                          </p>

                          {/* Dominant Emotions */}
                          <div>
                            <h4 className="text-sm uppercase text-zinc-400 mb-3">
                              Key Emotions
                            </h4>
                            <div className="space-y-2">
                              {summary.overall_summary?.dominant_emotions?.map(
                                (emot) => (
                                  <div
                                    key={emot.emotion}
                                    className="flex items-start gap-3"
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                      style={{
                                        backgroundColor:
                                          EMOTION_COLORS[emot.emotion] ||
                                          "#fbbf24",
                                      }}
                                    />
                                    <div>
                                      <p className="font-semibold">
                                        {emot.emotion} ({(emot.intensity * 100).toFixed(0)}%)
                                      </p>
                                      <p className="text-sm text-zinc-400">
                                        {emot.comment}
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Emotion Palette */}
                    {summary.emotion_palette && (
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                        <h3 className="text-2xl font-semibold mb-4">
                          Emotional Palette
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm uppercase text-zinc-400 mb-2">
                              Primary Mood
                            </p>
                            <p className="text-2xl font-bold">
                              {summary.emotion_palette.primary_mood}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm uppercase text-zinc-400 mb-2">
                              Energy Profile
                            </p>
                            <p className="text-2xl font-bold capitalize">
                              {summary.emotion_palette.energy_profile}
                            </p>
                          </div>
                        </div>
                        {summary.emotion_palette?.secondary_moods && (
                          <div className="mt-4">
                            <p className="text-sm uppercase text-zinc-400 mb-2">
                              Secondary Moods
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {summary.emotion_palette.secondary_moods.map(
                                (mood) => (
                                  <span
                                    key={mood}
                                    className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm"
                                  >
                                    {mood}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Emotion Tags */}
                    {summary.emotion_tags && (
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                        <h3 className="text-2xl font-semibold mb-4">
                          Emotion Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {summary.emotion_tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-pink-500/20 border border-yellow-400/30 text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Segment Comments */}
                    {summary.segment_comments && (
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                        <h3 className="text-2xl font-semibold mb-6">
                          Timeline Breakdown
                        </h3>
                        <div className="space-y-4">
                          {summary.segment_comments.map((segment, idx) => (
                            <div
                              key={idx}
                              className="flex gap-4 pb-4 border-b border-white/10 last:border-b-0"
                            >
                              <div className="flex-shrink-0">
                                <span className="text-sm font-semibold text-yellow-400">
                                  {segment.start_time.toFixed(1)}s -{" "}
                                  {segment.end_time.toFixed(1)}s
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {segment.title}
                                </p>
                                <p className="text-sm text-zinc-400 mt-1">
                                  {segment.message}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Emotional Highlights */}
                    {summary.emotional_highlights && (
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                        <h3 className="text-2xl font-semibold mb-6">
                          Emotional Highlights
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          {summary.emotional_highlights.map((highlight) => (
                            <div
                              key={highlight.title}
                              className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]"
                            >
                              <p className="text-sm text-yellow-400 font-semibold">
                                @ {highlight.timestamp.toFixed(2)}s
                              </p>
                              <p className="font-semibold mt-2">
                                {highlight.title}
                              </p>
                              <p className="text-sm text-zinc-400 mt-2">
                                {highlight.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Atmosphere */}
                    {summary.atmosphere && (
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                        <h3 className="text-2xl font-semibold mb-4">
                          Atmosphere & Mood
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm uppercase text-zinc-400 mb-2">
                              Scene
                            </p>
                            <p className="text-lg">
                              {summary.atmosphere.scene}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm uppercase text-zinc-400 mb-2">
                              Time of Day
                            </p>
                            <p className="text-lg">
                              {summary.atmosphere.time_of_day}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm uppercase text-zinc-400 mb-2">
                              Weather Feel
                            </p>
                            <p className="text-lg">
                              {summary.atmosphere.weather_feel}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mix Feedback */}
                    {summary.mix_feedback && (
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                        <h3 className="text-2xl font-semibold mb-6">
                          Mix Analysis
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <p className="font-semibold mb-2">
                              Emotional Consistency
                            </p>
                            <p className="text-zinc-300">
                              {summary.mix_feedback.emotional_consistency}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold mb-2">Dynamic Feel</p>
                            <p className="text-zinc-300">
                              {summary.mix_feedback.dynamic_feel}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold mb-2">Memorability</p>
                            <p className="text-zinc-300">
                              {summary.mix_feedback.memorability}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Listener Impression */}
                    {summary.overall_summary?.listener_impression && (
                      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-yellow-400/10 to-pink-500/10 p-8">
                        <p className="text-sm uppercase text-zinc-400 mb-2">
                          Listener Impression
                        </p>
                        <p className="text-lg leading-relaxed">
                          {summary.overall_summary.listener_impression}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
