import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AIInsights({
  insights,
}) {
  return (
    <Card className="border-white/10 bg-zinc-900/70">
      <CardHeader>
        <CardTitle>
          AI Insights
        </CardTitle>

        <CardDescription>
          Personalized music intelligence
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className=" rounded-xl border border-white/10 bg-zinc-800/60 p-4 text-sm text-zinc-300"
          >
            <p className="text-primary">{insight}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}