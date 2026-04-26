import HeadersSection from "../../../components/HeadersSection";
import { Laugh } from "lucide-react";

export default function EmotionPage() {
  return (
    <>
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
        <div>
          <HeadersSection
            title="EMOTIONAL ANALYSIS"
            icon={Laugh}
            songName="track_01_final_mix.wav · 4:23"
          />
        </div>
      </div>
    </>
  );
}
