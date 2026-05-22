import { Clock3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RecentActivities({
  activities,
}) {
  return (
    <Card className="border-white/10 bg-zinc-900/70">

      <CardHeader>
        <CardTitle>
          Recent Activities
        </CardTitle>

        <CardDescription>
          Latest project actions
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">

          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex gap-4"
            >

              <div className="flex flex-col items-center">

                <div className="rounded-full bg-yellow-500/20 p-2">
                  <Clock3 className="h-4 w-4 text-orange-400" />
                </div>

                {index !== activities.length - 1 && (
                  <div className="mt-2 h-full w-px bg-white/10" />
                )}
              </div>

              <div className="flex-1 rounded-xl border border-white/10 bg-zinc-800/50 p-4">

                <div className="flex items-center justify-between">

                  <h3 className="font-medium">
                    {activity.project}
                  </h3>

                  <span className="text-xs text-zinc-500">
                    {activity.time}
                  </span>
                </div>

                <p className="mt-2 text-sm text-zinc-400">
                  Project was{" "}

                  <span className="text-primary">
                    {activity.action.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}