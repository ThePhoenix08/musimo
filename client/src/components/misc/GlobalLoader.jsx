import { Music, Waves, AudioLines } from 'lucide-react';

const GlobalLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-zinc-900" />

      {/* Glow Effects */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-pink-500/20 blur-3xl animate-pulse" />

      <div className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-yellow-400/10 blur-3xl animate-pulse" />

      {/* Floating Icons */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-10 animate-bounce">
          <Waves className="w-12 h-12 text-cyan-400" />
        </div>

        <div className="absolute bottom-1/4 right-16 animate-pulse">
          <AudioLines className="w-16 h-16 text-yellow-400" />
        </div>
      </div>

      {/* Loader Content */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative flex items-center justify-center w-40 h-40">
          {/* Outer Circle */}
          <div className="absolute w-40 h-40 rounded-full border-4 border-yellow-500/20" />

          {/* Animated Spinner */}
          <div className="absolute w-40 h-40 rounded-full border-t-4 border-r-4 border-yellow-400 border-r-orange-500 animate-spin" />

          {/* Pulse Circle */}
          <div className="absolute w-32 h-32 rounded-full border border-cyan-400/40 animate-ping" />

          {/* Center Music Icon */}
          <div className="flex items-center justify-center w-24 h-24 rounded-full border border-zinc-700 bg-zinc-900 shadow-2xl shadow-pink-500/20">
            <Music className="music-icon w-10 h-10 text-yellow-400" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="mt-8 flex flex-col items-center">
          <p className="loading-text text-xl font-bold tracking-[0.3em]">
            LOADING
          </p>

          {/* Animated Dots */}
          <div className="flex gap-2 mt-4">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .music-icon {
          animation: musicPulse 1.8s ease-in-out infinite;
        }

        .loading-text {
          background: linear-gradient(
            90deg,
            #ffffff,
            #facc15,
            #ffffff
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 2s linear infinite;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: #facc15;
          animation: bounceDots 1.4s infinite ease-in-out;
        }

        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes musicPulse {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 0 6px #facc15);
          }

          25% {
            transform: scale(1.15) rotate(-8deg);
            filter: drop-shadow(0 0 14px #facc15);
          }

          50% {
            transform: scale(1.25) rotate(8deg);
            filter: drop-shadow(0 0 22px #facc15);
          }

          75% {
            transform: scale(1.15) rotate(-6deg);
            filter: drop-shadow(0 0 14px #facc15);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: 0% center;
          }

          100% {
            background-position: 200% center;
          }
        }

        @keyframes bounceDots {
          0%,
          80%,
          100% {
            transform: scale(0.6);
            opacity: 0.5;
          }

          40% {
            transform: scale(1.4);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoader;