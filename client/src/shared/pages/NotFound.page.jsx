import { Home, Music, Waves, AudioLines } from 'lucide-react';
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden px-6 relative">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-primary/10 blur-3xl rounded-full" />

      <div className="relative flex items-center justify-center w-full max-w-6xl h-[520px]">
        {/* Left 4 */}
        <div className="text-[260px] md:text-[320px] font-extralight text-muted-foreground/50 leading-none tracking-tight select-none drop-shadow-sm">
          4
        </div>

        {/* Guitar Section */}
        <div className="relative mx-4 md:mx-8 w-[260px] md:w-[300px] h-[460px] flex items-center justify-center">
          {/* Guitar Neck */}
          <div className="absolute top-0 w-14 h-[180px] bg-primary/30 rounded-b-3xl shadow-md" />

          {/* Strings */}
          <div className="absolute inset-0 flex justify-center gap-[14px] z-30">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-[2.5px] h-full bg-primary/60 rounded-full shadow-sm"
              />
            ))}
          </div>

          <div className="relative w-[230px] md:w-[260px] h-[230px] md:h-[260px] rounded-full bg-card border-[10px] border-primary/30 z-20 flex items-center justify-center shadow-2xl">
            <div className="absolute w-[120px] h-[120px] rounded-full border-[5px] border-primary/20" />

            <div className="text-primary text-5xl font-light rotate-90 tracking-[10px] opacity-90">
              404
            </div>
          </div>

          <div className="absolute bottom-0 flex gap-2 z-40">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full bg-primary/70 shadow-md"
              />
            ))}
          </div>
        </div>

        <div className="text-[260px] md:text-[320px] font-extralight text-muted-foreground/50 leading-none tracking-tight select-none drop-shadow-sm">
          4
        </div>
      </div>

      <div className="relative z-50 text-center -mt-5">
        <h3 className="text-3xl md:text-5xl font-bold text-foreground tracking-wide mb-4">
          Page Not Found
        </h3>

        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-8">
          The page you are looking for might have been removed,
          renamed, or is temporarily unavailable.
        </p>

        <button
          onClick={() => (window.location.href = '/app')}
          className="group mt-10 inline-flex items-center gap-3 rounded-full border border-yellow-400/30 bg-zinc-900/70 px-7 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-yellow-500 hover:bg-zinc-800 hover:shadow-lg hover:shadow-yellow-500/20"
        >
          <Home className="h-4 w-4 text-yellow-400 transition-transform duration-300 group-hover:scale-110" />
          Go Back Home
        </button>
      </div>
    </div>
  );
}