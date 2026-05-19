import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";

export default function EmotionBreakdown({
  emotions,
}) {
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

      <CardContent className="space-y-5">
        {emotions.map((emotion) => (
          <div
            key={emotion.label}
            className="space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span>{emotion.label}</span>

              <span>{emotion.value}%</span>
            </div>

            <Progress value={emotion.value} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}