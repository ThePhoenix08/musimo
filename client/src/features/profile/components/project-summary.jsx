import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProjectSummary({
  stats,
  analysisDistribution = [],
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
          <span>
            Total Projects
          </span>
          <span className="text-xl font-bold text-yellow-400">
            {stats?.total_projects || 0}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-800/50 p-4">

          <span>
            Total Tracks
          </span>

          <span className="text-xl font-bold text-yellow-400">
            {stats?.total_songs || 0}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-800/50 p-4">
          <span>
            Total Duration
          </span>
          <span className="text-xl font-bold text-yellow-400">
            {Math.round(
              stats?.total_duration_seconds || 0
            )}s
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-800/40 p-4">
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">
            Analysis Distribution
          </h3>
          <div className="space-y-3">
            {
              analysisDistribution.length > 0 ? (

                analysisDistribution.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl bg-zinc-900/70 px-4 py-3"
                    >
                      <span className="capitalize text-zinc-300">
                        {item.analysis_type}
                      </span>
                      <span className="font-bold text-yellow-400">
                        {item.count}
                      </span>
                    </div>

                  )
                )
              ) : (

                <div className="text-center text-sm text-zinc-500">
                  No Analysis Data
                </div>
              )
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}