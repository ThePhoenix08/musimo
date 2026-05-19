import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function ProfileStats({
  stats,
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">

      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="border-white/10 bg-zinc-900/70"
        >
          <CardContent className="flex items-center justify-between p-6">

            <div>
              <p className="text-sm text-zinc-400">
                {stat.title}
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {stat.value}
              </h2>
            </div>

            <div className="rounded-xl bg-yellow-500/10 p-3">
              <stat.icon className="h-6 w-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}