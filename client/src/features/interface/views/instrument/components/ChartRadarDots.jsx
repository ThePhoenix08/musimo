import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const chartData = [
  { label: "Rhythm", value: 82 },
  { label: "Melody", value: 91 },
  { label: "Harmony", value: 67 },
  { label: "Dynamics", value: 74 },
  { label: "Timbre", value: 88 },
  { label: "Texture", value: 70 },
  { label: "pitch", value: 70 },
];

function ChartRadarDots() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={chartData} outerRadius="90%">
        <PolarGrid stroke="oklch(0.2684 0.0134 41.6416)" />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fill: "oklch(0.6 0.01 49)", fontSize: 11 }}
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
          formatter={(value) => [value, "Score"]}
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
