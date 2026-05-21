import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProjectSummary({
  stats,
}) {

  return (
    <Card className="border-white/10 bg-zinc-900/70">
      <CardHeader>
        <CardTitle>
          Project Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-800/50 p-4">
          <span>Total Projects</span>
          <span className="text-xl font-bold text-yellow-400">
            {stats?.total_projects || 0}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-800/50 p-4">
          <span>Total Tracks</span>
          <span className="text-xl font-bold text-yellow-400">
            {stats?.total_songs || 0}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-800/50 p-4">
          <span>Total Duration</span>
          <span className="text-xl font-bold text-yellow-400">
            {stats?.total_duration_seconds || 0}s
          </span>
        </div>
      </CardContent>
    </Card>
  );
}