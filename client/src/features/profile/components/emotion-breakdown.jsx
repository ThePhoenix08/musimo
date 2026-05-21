import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function EmotionBreakdown({
  emotions,
}) {

  const chartData =
    emotions.map((emotion) => ({
      subject: emotion.label,
      value: emotion.value,
    }));

  return (
    <Card className="border-white/10 bg-zinc-900/70">

      <CardHeader>

        <CardTitle>
          Emotion Score Breakdown
        </CardTitle>

        <CardDescription>
          AI-generated emotional analysis
        </CardDescription>
      </CardHeader>

      <CardContent>

        <div className="h-[420px] w-full">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <RadarChart
              data={chartData}
            >

              <PolarGrid
                stroke="#3f3f46"
              />

              <PolarAngleAxis
                dataKey="subject"
                tick={{
                  fill: "#d4d4d8",
                  fontSize: 12,
                }}
              />

              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{
                  fill: "#71717a",
                  fontSize: 10,
                }}
              />

              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border:
                    "1px solid #3f3f46",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />

              <Radar
                name="Emotion"
                dataKey="value"
                stroke="#facc15"
                fill="#facc15"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}