import React from "react";
import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Volume2, ChevronRight } from "lucide-react";
import StatCard from "../components/StatCard";

function LeftSection() {
  const [activeComment, setActiveComment] = useState(0);

  const comments = [
    {
      icon: Sparkles,
      title: "Strong Melodic Core",
      body: "The lead melody demonstrates exceptional tonal clarity with well-placed ornaments. The guitar phrasing in bars 8–16 shows a mature understanding of tension and release.",
    },
    {
      icon: TrendingUp,
      title: "Dynamic Range",
      body: "Dynamics shift from ppp to fff across three movements. The crescendo at bar 32 is particularly effective — the orchestral swell feels organic rather than mechanical.",
    },
    {
      icon: Volume2,
      title: "Mix Suggestion",
      body: "The low-mid frequencies (200–400 Hz) are slightly congested. A gentle hi-pass on the rhythm guitar track could give the bass guitar more room to breathe.",
    },
  ];

  useEffect(() => {
    const id = setInterval(
      () => setActiveComment((c) => (c + 1) % comments.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex flex-col gap-4 p-5 border-r"
      style={{
        width: "58%",
        borderColor: "oklch(0.2684 0.0134 41.6416)",
      }}
    >
      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Overall Score" value="81" unit="/ 100" delay="0.1s" />
        <StatCard label="Tempo (BPM)" value="124" unit="bpm" delay="0.2s" />
        <StatCard label="Key Detected" value="A♭m" unit="minor" delay="0.3s" />
      </div>

      {/* AI Summary */}
      <div
        className="rounded-2xl border p-5 flex flex-col gap-3"
        style={{
          background: "oklch(0.1469 0.0041 49.2499)",
          borderColor: "oklch(0.2684 0.0134 41.6416)",
          animation: "fadeSlideIn 0.5s ease 0.35s forwards",
          opacity: 0,
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles
            size={14}
            style={{ color: "oklch(0.829 0.1712 81.0381)" }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "oklch(0.829 0.1712 81.0381)" }}
          >
            AI Summary
          </span>
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "oklch(0.8884 0.0042 91.45)" }}
        >
          This track demonstrates a compelling fusion of neo-soul harmonic
          progressions with contemporary production techniques. The arrangement
          achieves a rare balance — rhythmically complex without sacrificing
          listener accessibility. Standout elements include the interplay
          between the Rhodes keys and the percussive guitar strumming, creating
          a textured midrange that feels both warm and present.
        </p>
        <div className="flex gap-2 flex-wrap mt-1">
          {["Neo-soul", "Polyrhythm", "Rich harmonics", "Warm mix"].map(
            (tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{
                  borderColor: "oklch(0.829 0.1712 81.0381 / 0.3)",
                  color: "oklch(0.829 0.1712 81.0381)",
                  background: "oklch(0.829 0.1712 81.0381 / 0.08)",
                }}
              >
                {tag}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Accordion comments */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: "oklch(0.2684 0.0134 41.6416)",
          animation: "fadeSlideIn 0.5s ease 0.5s forwards",
          opacity: 0,
        }}
      >
        {comments.map((c, idx) => {
          const Icon = c.icon;
          const isActive = idx === activeComment;
          return (
            <div
              key={idx}
              className="p-4 border-b cursor-pointer transition-all duration-300"
              style={{
                borderColor: "oklch(0.2684 0.0134 41.6416)",
                background: isActive
                  ? "oklch(0.1469 0.0041 49.2499)"
                  : "transparent",
                borderLeft: isActive
                  ? "3px solid oklch(0.829 0.1712 81.0381)"
                  : "3px solid transparent",
              }}
              onClick={() => setActiveComment(idx)}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  size={13}
                  style={{ color: "oklch(0.829 0.1712 81.0381)" }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: "oklch(0.9216 0.0928 92.2138)" }}
                >
                  {c.title}
                </span>
                <ChevronRight
                  size={12}
                  style={{
                    color: "oklch(0.829 0.1712 81.0381)",
                    marginLeft: "auto",
                    opacity: isActive ? 1 : 0.3,
                    transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease, opacity 0.3s ease",
                  }}
                />
              </div>
              {isActive && (
                <p
                  className="text-xs leading-relaxed mt-1"
                  style={{ color: "oklch(0.7312 0.0102 93.609)" }}
                >
                  {c.body}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LeftSection;
