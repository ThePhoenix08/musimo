import { useEffect, useMemo, useRef, useState } from "react";
import HeroImage from "../../../assets/Images/hero-img.jpg";
import { Features } from "../components/Features";
import { LampDemo } from "../components/LampDemo";
import CanvasTextDemo from "../components/canvas-text-demo";
import { useNavigate } from "react-router";
import { ROUTES } from "@/shared/constants/routes.constants";

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

function Reveal({ children, className = "", delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const ico = "w-full h-full";
const Icon = {
  logo: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <path d="M3 13h3l2.5-7 4 15 2.5-9 1.5 3H21" />
    </svg>
  ),
  arrow: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  emotion: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <path d="M2 13h3.5l2-7 4 15 2.5-11 1.5 3H22" />
    </svg>
  ),
  instrument: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <line x1="7" y1="5" x2="7" y2="13" />
      <line x1="11" y1="5" x2="11" y2="13" />
      <line x1="15" y1="5" x2="15" y2="13" />
      <line x1="19" y1="5" x2="19" y2="13" />
    </svg>
  ),
  spectrogram: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <rect x="3" y="13" width="2.6" height="7" />
      <rect x="7.8" y="9" width="2.6" height="11" />
      <rect x="12.6" y="4" width="2.6" height="16" />
      <rect x="17.4" y="11" width="2.6" height="9" />
    </svg>
  ),
  tag: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <path d="M20.5 12.5L13 20a1.7 1.7 0 01-2.4 0L3.5 12.9A1.7 1.7 0 013 11.7V5a2 2 0 012-2h6.7c.45 0 .88.18 1.2.5l7.6 7.6c.66.67.66 1.73 0 2.4z" />
      <circle cx="8" cy="8" r="1.4" />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2M9 2h6M12 2v2" />
    </svg>
  ),
  layers: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <path d="M12 3l8 4.5-8 4.5-8-4.5z" />
      <path d="M4 12l8 4.5 8-4.5M4 16.5L12 21l8-4.5" />
    </svg>
  ),
  fader: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <line x1="6" y1="4" x2="6" y2="20" />
      <rect x="3.3" y="9" width="5.4" height="3.4" rx="1" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <rect x="9.3" y="14" width="5.4" height="3.4" rx="1" />
      <line x1="18" y1="4" x2="18" y2="20" />
      <rect x="15.3" y="6" width="5.4" height="3.4" rx="1" />
    </svg>
  ),
  composer: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <circle cx="6" cy="17" r="3" />
      <circle cx="17" cy="15" r="3" />
      <path d="M9 17V5l11-2v12" />
    </svg>
  ),
  clapper: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <rect x="3" y="6" width="18" height="13" rx="1.5" />
      <path d="M3 10l3-4M9 10l3-4M15 10l3-4" />
    </svg>
  ),
  microscope: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <path d="M9 3h2v5H9zM13 3v5" />
      <path d="M7 8h6l1.5 11a2 2 0 01-2 2.2H7.5A2 2 0 015.5 19z" />
      <line x1="6" y1="14" x2="14" y2="14" />
    </svg>
  ),
  waveform: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <path d="M2 12h3l1.5-5 3 10 2-13 2 13 2-8 1.5 3H22" />
    </svg>
  ),
  network: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ico}
    >
      <circle cx="4" cy="6" r="1.6" />
      <circle cx="4" cy="12" r="1.6" />
      <circle cx="4" cy="18" r="1.6" />
      <circle cx="12" cy="9" r="1.6" />
      <circle cx="12" cy="15" r="1.6" />
      <circle cx="20" cy="12" r="1.6" />
      <line x1="5.5" y1="6" x2="10.6" y2="8.7" />
      <line x1="5.5" y1="12" x2="10.6" y2="9.7" />
      <line x1="5.5" y1="12" x2="10.6" y2="14.3" />
      <line x1="5.5" y1="18" x2="10.6" y2="15.3" />
      <line x1="13.5" y1="9" x2="18.5" y2="11.4" />
      <line x1="13.5" y1="15" x2="18.5" y2="12.6" />
    </svg>
  ),
};

const AUDIENCE = [
  { label: "Sound Engineers", icon: Icon.fader },
  { label: "Composers", icon: Icon.composer },
  { label: "Video Editors", icon: Icon.clapper },
  { label: "Researchers", icon: Icon.microscope },
];

const USE_CASES = [
  {
    title: "Sound Engineers",
    icon: Icon.fader,
    desc: "Cross-check a mix against the emotional and instrumental read Musimo gives you before it ships.",
  },
  {
    title: "Composers",
    icon: Icon.composer,
    desc: "See how a change in arrangement or instrumentation moves the emotional arc of a piece.",
  },
  {
    title: "Video Editors & Creators",
    icon: Icon.clapper,
    desc: "Match a track's mood and energy to a scene without scrubbing through hours of audio.",
  },
  {
    title: "Researchers",
    icon: Icon.microscope,
    desc: "Run consistent, repeatable analysis across large MIR datasets instead of manual annotation.",
  },
];

const PIPELINE = [
  {
    step: "STEP 01",
    title: "Raw Audio",
    icon: Icon.waveform,
    desc: "Upload a full mix, a stem, or a single take.",
    pulse: "anim-pulse-1",
  },
  {
    step: "STEP 02",
    title: "Feature Extraction",
    icon: Icon.spectrogram,
    desc: "The signal becomes mel-spectrograms and other audio features.",
    pulse: "anim-pulse-2",
  },
  {
    step: "STEP 03",
    title: "Deep Learning Core",
    icon: Icon.network,
    desc: "Convolutional and sequence models read patterns across time and frequency.",
    pulse: "anim-pulse-3",
  },
  {
    step: "STEP 04",
    title: "Structured Insight",
    icon: Icon.tag,
    desc: "Out comes a structured read of the track.",
    pulse: "anim-pulse-4",
    chips: ["Emotion", "Instruments", "Structure"],
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const eqBars = useMemo(
    () =>
      Array.from({ length: 28 }, () => ({
        height: 14 + Math.random() * 50,
        duration: (1.6 + Math.random() * 1.8).toFixed(2),
        delay: (Math.random() * 2).toFixed(2),
      })),
    [],
  );

  return (
    <div className="bg-zinc-950 text-zinc-100 font-sans antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display{ font-family:'Space Grotesk', sans-serif; }
        .font-mono-c{ font-family:'JetBrains Mono', monospace; }
        .musimo-root ::selection{ background:#fbbf24; color:#0a0a0a; }

        @keyframes eqbar{ 0%,100%{ height:18%; } 50%{ height:100%; } }
        @keyframes travel{ 0%{ left:6%; } 100%{ left:calc(94% - 11px); } }
        @keyframes nodepulse1{ 0%,4%{ border-color:#fbbf24; box-shadow:0 0 0 6px rgba(251,191,36,0.18); } 10%,100%{ border-color:#27272a; box-shadow:none; } }
        @keyframes nodepulse2{ 0%,30%,38%{ border-color:#27272a; box-shadow:none; } 33%{ border-color:#fbbf24; box-shadow:0 0 0 6px rgba(251,191,36,0.18); } 100%{ border-color:#27272a; box-shadow:none; } }
        @keyframes nodepulse3{ 0%,62%{ border-color:#27272a; box-shadow:none; } 66%{ border-color:#fbbf24; box-shadow:0 0 0 6px rgba(251,191,36,0.18); } 71%,100%{ border-color:#27272a; box-shadow:none; } }
        @keyframes nodepulse4{ 0%,94%{ border-color:#27272a; box-shadow:none; } 99%,100%{ border-color:#fbbf24; box-shadow:0 0 0 6px rgba(251,191,36,0.18); } }

        .anim-eqbar{ animation-name: eqbar; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .anim-travel{ animation: travel 7s linear infinite; }
        .anim-pulse-1{ animation: nodepulse1 7s ease-in-out infinite; }
        .anim-pulse-2{ animation: nodepulse2 7s ease-in-out infinite; }
        .anim-pulse-3{ animation: nodepulse3 7s ease-in-out infinite; }
        .anim-pulse-4{ animation: nodepulse4 7s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce){
          .anim-eqbar, .anim-travel, .anim-pulse-1, .anim-pulse-2, .anim-pulse-3, .anim-pulse-4{ animation: none !important; }
        }
      `}</style>

      <div className="musimo-root">
        {/* ============================= NAVBAR ============================= */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled
              ? "bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 py-3"
              : "py-5"
          }`}
        >
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
            <a
              href="#hero"
              className="flex items-center gap-2 font-display font-bold text-lg"
            >
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-zinc-950 p-1.5">
                {Icon.logo}
              </span>
              Musimo
            </a>
            <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
              <a
                href="#features"
                className="hover:text-zinc-100 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="hover:text-zinc-100 transition-colors"
              >
                How it Works
              </a>
              <a
                href="#use-cases"
                className="hover:text-zinc-100 transition-colors"
              >
                Use Cases
              </a>
            </div>
            <button
              onClick={() => navigate(ROUTES.LOGIN, { replace: true })}
              className="inline-flex cursor-pointer items-center gap-2 bg-amber-400 text-zinc-950 font-semibold text-sm px-5 py-2.5 rounded-lg hover:-translate-y-0.5 transition-transform"
            >
              Try Musimo
            </button>
          </div>
        </nav>

        {/* ============================= HERO ============================= */}
        <header
          id="hero"
          className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden border-b border-zinc-800"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HeroImage})` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(9,9,11,0.55) 0%, rgba(9,9,11,0.82) 48%, rgba(9,9,11,0.97) 100%), radial-gradient(ellipse 60% 50% at 50% 8%, rgba(251,191,36,0.18), transparent 70%)",
            }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 flex items-end justify-center opacity-20"
            style={{
              height: "46%",
              gap: "7px",
              WebkitMaskImage:
                "linear-gradient(to top, black, transparent 92%)",
              maskImage: "linear-gradient(to top, black, transparent 92%)",
            }}
          >
            {eqBars.map((bar, i) => (
              <span
                key={i}
                className="w-1 rounded-t-sm bg-gradient-to-t from-amber-400 to-transparent anim-eqbar"
                style={{
                  height: `${bar.height}%`,
                  animationDuration: `${bar.duration}s`,
                  animationDelay: `-${bar.delay}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center gap-2">
            <h1 className="font-display font-semibold text-4xl sm:text-5xl md:text-6xl leading-tight max-w-3xl">
              Deep Learning That Hears
              <br />
              the <span className="text-amber-400">Emotion</span> in Every Track
            </h1>

            <p className="text-zinc-300 text-base md:text-lg max-w-xl">
              Musimo combines deep learning and audio signal processing to read
              the emotional tone, instrumentation, and structure of any
              recording
            </p>

            <div className="flex gap-3.5 flex-wrap justify-center mt-1">
              <button
                onClick={() => navigate(ROUTES.LOGIN, { replace: true })}
                className="inline-flex cursor-pointer items-center gap-2 bg-amber-400 text-zinc-950 font-semibold text-base px-6 py-3 rounded-lg hover:-translate-y-0.5 transition-transform"
                style={{ boxShadow: "0 8px 24px -8px rgba(251,191,36,0.5)" }}
              >
                Try Musimo
                <span className="w-4 h-4">{Icon.arrow}</span>
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-100 font-semibold text-base px-6 py-3 rounded-lg hover:bg-zinc-900 hover:-translate-y-0.5 transition-all"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-10 w-full max-w-2xl pt-6 border-t border-zinc-800">
              <span className="block text-center font-mono-c text-xs uppercase tracking-wider text-zinc-500 mb-5">
                Built for people who work with sound
              </span>
              <div className="flex items-center justify-center gap-9 flex-wrap">
                {AUDIENCE.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 text-zinc-300 text-sm font-semibold"
                  >
                    <span className="w-5 h-5 text-amber-400 flex-shrink-0">
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section id="features">
          <div className="max-w-6xl mx-auto px-6">
            <LampDemo />

            <Features />
          </div>
        </section>

        {/* ============================= HOW IT WORKS ============================= */}
        <section id="how-it-works">
          <div className="mx-auto px-6">
            <Reveal className="mx-auto text-center flex flex-col items-center justify-center gap-2 mb-28">
              <span className="font-mono-c text-xs uppercase tracking-wider text-amber-400 inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Under the Hood
              </span>
              <CanvasTextDemo />
              <p className="text-zinc-400">
                A single recording moves through signal processing and deep
                learning models before it becomes a structured, readable result.
              </p>
            </Reveal>

            <Reveal className="relative">
              <div
                className="hidden md:block absolute"
                style={{
                  top: "51px",
                  left: "6%",
                  right: "6%",
                  height: "2px",
                  background:
                    "linear-gradient(to right, transparent, #27272a 6%, #27272a 94%, transparent)",
                }}
              />
              <div
                className="hidden md:block absolute rounded-full anim-travel"
                style={{
                  top: "46px",
                  width: "11px",
                  height: "11px",
                  background: "#fbbf24",
                  boxShadow:
                    "0 0 0 4px rgba(251,191,36,0.25), 0 0 16px 2px rgba(251,191,36,0.6)",
                  left: "6%",
                }}
              />

              <div className="relative grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-5">
                {PIPELINE.map((node) => (
                  <div
                    key={node.step}
                    className="flex flex-col items-center text-center gap-1.5"
                  >
                    <span className="font-mono-c text-xs tracking-wider text-zinc-500 mb-1.5">
                      {node.step}
                    </span>
                    <div
                      className={`w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400 mb-1.5 p-4 ${node.pulse}`}
                    >
                      {node.icon}
                    </div>
                    <h4 className="text-base font-display font-semibold">
                      {node.title}
                    </h4>
                    <p
                      className="text-zinc-400 text-sm"
                      style={{ maxWidth: "220px" }}
                    >
                      {node.desc}
                    </p>
                    {node.chips && (
                      <div className="flex gap-1.5 flex-wrap justify-center mt-2">
                        {node.chips.map((chip) => (
                          <span
                            key={chip}
                            className="font-mono-c text-xs px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-900"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============================= USE CASES ============================= */}
        <section id="use-cases" className="py-28">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal className="max-w-xl mx-auto text-center flex flex-col items-center gap-3.5 mb-14">
              <span className="font-mono-c text-xs uppercase tracking-wider text-amber-400 inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Who It's For
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-semibold">
                Built for the People Behind the Sound
              </h2>
              <p className="text-zinc-400">
                Musimo fits into the workflow you already have — as a second
                pair of ears, not a replacement for your own.
              </p>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {USE_CASES.map((u, i) => (
                <Reveal key={u.title} delay={i * 60}>
                  <div className="h-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:-translate-y-1 hover:border-zinc-700 transition-all">
                    <div className="w-9 h-9 text-amber-400 mb-4">{u.icon}</div>
                    <h3 className="text-base font-display font-semibold mb-2">
                      {u.title}
                    </h3>
                    <p className="text-zinc-400 text-sm">{u.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================= CTA BAND ============================= */}
        <section id="cta" className="py-28 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal>
              <div className="relative text-center rounded-3xl border border-zinc-800 bg-zinc-900 py-16 px-8 overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(251,191,36,0.14), transparent 70%)",
                  }}
                />
                <div className="relative z-10">
                  <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3.5">
                    Let Musimo Listen to Your Next Track
                  </h2>
                  <p className="text-zinc-400 max-w-md mx-auto mb-7">
                    Upload a file or connect a library, and get an emotional and
                    instrumental breakdown in minutes.
                  </p>
                  <button
                    onClick={() => navigate(ROUTES.LOGIN, { replace: true })}
                    className="inline-flex cursor-pointer items-center gap-2 bg-amber-400 text-zinc-950 font-semibold text-base px-6 py-3 rounded-lg hover:-translate-y-0.5 transition-transform"
                    style={{
                      boxShadow: "0 8px 24px -8px rgba(251,191,36,0.5)",
                    }}
                  >
                    Try Musimo
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============================= FOOTER ============================= */}
        <footer className="py-14">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex justify-between items-start flex-wrap gap-9 pb-9 border-b border-zinc-800">
              <div>
                <a
                  href="#hero"
                  className="flex items-center gap-2 font-display font-bold text-lg"
                >
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-zinc-950 p-1.5">
                    {Icon.logo}
                  </span>
                  Musimo
                </a>
                <p
                  className="text-zinc-400 text-sm mt-2.5"
                  style={{ maxWidth: "280px" }}
                >
                  Audio intelligence for people who work with sound.
                </p>
              </div>
              <div className="flex gap-14 flex-wrap">
                <div>
                  <h5 className="font-mono-c text-xs uppercase tracking-wider text-zinc-500 mb-3.5">
                    Product
                  </h5>
                  <a
                    href="#features"
                    className="block text-zinc-400 text-sm mb-2.5 hover:text-zinc-100 transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    className="block text-zinc-400 text-sm mb-2.5 hover:text-zinc-100 transition-colors"
                  >
                    How it Works
                  </a>
                  <a
                    href="#use-cases"
                    className="block text-zinc-400 text-sm mb-2.5 hover:text-zinc-100 transition-colors"
                  >
                    Use Cases
                  </a>
                </div>
                <div>
                  <h5 className="font-mono-c text-xs uppercase tracking-wider text-zinc-500 mb-3.5">
                    Company
                  </h5>
                  <a
                    href="#"
                    className="block text-zinc-400 text-sm mb-2.5 hover:text-zinc-100 transition-colors"
                  >
                    About
                  </a>
                  <a
                    href="#"
                    className="block text-zinc-400 text-sm mb-2.5 hover:text-zinc-100 transition-colors"
                  >
                    Research
                  </a>
                  <a
                    href="#"
                    className="block text-zinc-400 text-sm mb-2.5 hover:text-zinc-100 transition-colors"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center flex-wrap gap-2.5 pt-5 text-zinc-500 text-sm">
              <span>
                © 2026 Musimo. Built for sound engineers, composers, and the
                people who work with sound.
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
