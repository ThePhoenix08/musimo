import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProjectSummary() {
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

          <span className="text-xl text-yellow-400 font-bold">
            24
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-800/50 p-4">
          <span>Total Tracks</span>

          <span className="text-xl text-yellow-400 font-bold">
            312
          </span>
        </div>
      </CardContent>
    </Card>
  );
}