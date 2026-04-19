import React from "react";

function RadarChart({ data, animated }) {
  const cx = 120,
    cy = 120,
    r = 90;
  const total = data.length;

  const toXY = (i, val) => {
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    const dist = (val / 100) * r;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
  };

  const labelXY = (i) => {
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    return [cx + (r + 22) * Math.cos(angle), cy + (r + 22) * Math.sin(angle)];
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const polygonPoints = (scale) =>
    data
      .map((_, i) => {
        const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
        return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`;
      })
      .join(" ");

  return (
    // ✅ h-full + w-full so it fills whatever height the parent sets (220px)
    // ✅ block display so the div doesn't add extra inline spacing
    <div className="w-full h-full">
      {/* ✅ svg also w-full h-full — viewBox handles the internal scaling */}
      <svg
        viewBox="0 0 240 240"
        className="w-full h-full"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="oklch(0.829 0.1712 81.0381)"
              stopOpacity="0.25"
            />
            <stop
              offset="100%"
              stopColor="oklch(0.829 0.1712 81.0381)"
              stopOpacity="0.03"
            />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid polygons */}
        {gridLevels.map((scale, gi) => (
          <polygon
            key={gi}
            points={polygonPoints(scale)}
            fill="none"
            stroke="oklch(0.829 0.1712 81.0381)"
            strokeOpacity={0.12 + gi * 0.06}
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const [x, y] = toXY(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="oklch(0.829 0.1712 81.0381)"
              strokeOpacity="0.2"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={data.map((d, i) => toXY(i, d.value).join(",")).join(" ")}
          fill="url(#radarGrad)"
          stroke="oklch(0.829 0.1712 81.0381)"
          strokeWidth="2"
          filter="url(#glow)"
          style={{
            transition: "all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            opacity: animated ? 1 : 0,
          }}
        />

        {/* Data dots */}
        {data.map((d, i) => {
          const [x, y] = toXY(i, d.value);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="oklch(0.829 0.1712 81.0381)"
              filter="url(#glow)"
              style={{
                transition: `all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s`,
                opacity: animated ? 1 : 0,
              }}
            />
          );
        })}

        {/* Labels */}
        {data.map((d, i) => {
          const [lx, ly] = labelXY(i);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="oklch(0.8884 0.0042 91.45)"
              fontFamily="system-ui"
              fontWeight="500"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default RadarChart;
