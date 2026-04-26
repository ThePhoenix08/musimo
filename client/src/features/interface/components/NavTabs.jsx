import { useRef, useLayoutEffect, useState } from "react";
import {
  Activity,
  HeartPulse,
  Guitar,
  BarChart2,
  Scissors,
} from "lucide-react";
import { VALID_VIEWS } from "../data";

const TAB_ICONS = {
  status: Activity,
  emotion: HeartPulse,
  instrument: Guitar,
  features: BarChart2,
  separate: Scissors,
};

const NavTabs = ({ currentTab, changeTab }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const tabRefs = useRef({});
  const navRef = useRef(null);

  useLayoutEffect(() => {
    const activeEl = tabRefs.current[currentTab];
    const navEl = navRef.current;
    if (!activeEl || !navEl) return;

    const navRect = navEl.getBoundingClientRect();
    const tabRect = activeEl.getBoundingClientRect();

    setIndicatorStyle({
      left: tabRect.left - navRect.left,
      width: tabRect.width,
    });
  }, [currentTab]);

  useLayoutEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes navTabIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerSweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes indicatorSlide {
          from { opacity: 0; transform: scaleX(0.8); }
          to   { opacity: 1; transform: scaleX(1); }
        }

        .nav-tab-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          border: none;
          background: transparent;
          white-space: nowrap;
          transition: color 0.25s ease;
          overflow: hidden;
          color: oklch(0.5 0.01 90);
          z-index: 1;
          font-family: system-ui, sans-serif;
        }

        .nav-tab-item:hover {
          color: oklch(0.85 0.12 88);
        }

        /* Shimmer on hover */
        .nav-tab-item::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 30%,
            oklch(0.829 0.1712 81.0381 / 0.12) 50%,
            transparent 70%
          );
          transform: translateX(-100%);
          transition: none;
          pointer-events: none;
        }
        .nav-tab-item:hover::before {
          animation: shimmerSweep 0.55s ease forwards;
        }

        .nav-tab-item[data-active="true"] {
          color: oklch(0.1469 0.0041 49.2499);
          font-weight: 600;
        }

        /* Icon inside each tab */
        .nav-tab-icon {
          flex-shrink: 0;
          transition:
            color 0.25s ease,
            transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
            filter 0.25s ease;
          color: oklch(0.5 0.01 90);
        }
        .nav-tab-item:hover .nav-tab-icon {
          color: oklch(0.85 0.12 88);
          transform: scale(1.15);
        }
        .nav-tab-item[data-active="true"] .nav-tab-icon {
          color: oklch(0.1469 0.0041 49.2499);
          transform: scale(1.1);
          filter: drop-shadow(0 0 3px oklch(0.1 0 0 / 0.4));
        }

        /* Sliding pill indicator */
        .nav-indicator {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          height: 32px;
          border-radius: 8px;
          background: oklch(0.829 0.1712 81.0381);
          pointer-events: none;
          z-index: 0;
          transition: left 0.35s cubic-bezier(0.65, 0, 0.35, 1),
                      width 0.35s cubic-bezier(0.65, 0, 0.35, 1);
          /* Glow */
          box-shadow:
            0 0 12px oklch(0.829 0.1712 81.0381 / 0.5),
            0 0 28px oklch(0.829 0.1712 81.0381 / 0.25),
            inset 0 1px 0 oklch(1 0 0 / 0.2);
        }

        /* Inner highlight stripe on indicator */
        .nav-indicator::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 12px;
          right: 12px;
          height: 1px;
          border-radius: 999px;
          background: oklch(1 0 0 / 0.35);
        }

        /* Glow halo behind indicator */
        .nav-indicator::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 12px;
          background: oklch(0.829 0.1712 81.0381 / 0.15);
          filter: blur(6px);
          animation: glowPulse 2.5s ease-in-out infinite;
        }

        .nav-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0 4px;
          height: 100%;
          flex: 1;
          min-width: 0;
          /* Subtle scanline texture for depth */
          background-image: repeating-linear-gradient(
            0deg,
            oklch(0 0 0 / 0.04) 0px,
            oklch(0 0 0 / 0.04) 1px,
            transparent 1px,
            transparent 3px
          );
        }

        /* Left edge fade for overflow */
        .nav-scroll-container {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .nav-scroll-container::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 32px;
          background: linear-gradient(to right, transparent, var(--background));
          pointer-events: none;
          z-index: 10;
        }

        /* Section label above tabs */
        .nav-section-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: oklch(0.829 0.1712 81.0381 / 0.5);
          padding: 0 8px;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: system-ui, sans-serif;
          border-right: 1px solid oklch(0.2684 0.0134 41.6416);
          margin-right: 6px;
          height: 100%;
          display: flex;
          align-items: center;
        }
      `}</style>

      <div className="nav-scroll-container">
        <div className="nav-wrapper" ref={navRef}>
          <div
            className="nav-indicator"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />

          {VALID_VIEWS.map((tab, i) => {
            const Icon = TAB_ICONS[tab.key];
            return (
              <button
                key={tab.key}
                ref={(el) => (tabRefs.current[tab.key] = el)}
                className="nav-tab-item"
                data-active={currentTab === tab.key}
                onClick={() => changeTab(tab.key)}
                style={{
                  opacity: mounted ? 1 : 0,
                  animation: mounted
                    ? `navTabIn 0.4s ease ${i * 0.07}s both`
                    : "none",
                }}
              >
                {Icon && <Icon size={13} className="nav-tab-icon" />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default NavTabs;
