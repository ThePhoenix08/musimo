import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function capitalize(str) {
  return str?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ChartRadarDots({ instruments = [] }) {
  const chartData = instruments.map((item) => ({
    label: capitalize(item.instrument),
    value: parseFloat(item.percentage.toFixed(2)),
  }));

  if (chartData.length < 3) {
    return (
      <div
        className="flex items-center justify-center h-full text-xs"
        style={{ color: "oklch(0.45 0.02 81)" }}
      >
        {chartData.length === 0
          ? "Awaiting analysis…"
          : "Need at least 3 predictions for radar"}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={chartData} outerRadius="78%">
        <PolarGrid stroke="oklch(0.2684 0.0134 41.6416)" />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fill: "oklch(0.65 0.02 81)", fontSize: 11 }}
        />
        <Tooltip
          cursor={false}
          contentStyle={{
            background: "oklch(0.1469 0.0041 49.2499)",
            border: "1px solid oklch(0.2684 0.0134 41.6416)",
            borderRadius: "8px",
            color: "oklch(0.829 0.1712 81.0381)",
            fontSize: 12,
          }}
          formatter={(value) => [`${value}%`, "Confidence"]}
        />
        <Radar
          dataKey="value"
          stroke="oklch(0.829 0.1712 81.0381)"
          fill="oklch(0.829 0.1712 81.0381)"
          fillOpacity={0.25}
          dot={{
            r: 4,
            fill: "oklch(0.829 0.1712 81.0381)",
            fillOpacity: 1,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default ChartRadarDots;
