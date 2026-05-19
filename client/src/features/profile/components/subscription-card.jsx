import { Crown } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SubscriptionCard() {
  return (
    <Card className="border-white/10 bg-zinc-900/70">

      <CardHeader>
        <CardTitle>
          Subscription
        </CardTitle>
      </CardHeader>

      <CardContent>

        <div className="flex flex-col gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-6 md:flex-row md:items-center md:justify-between">

          <div>

            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Crown className="h-5 w-5 text-yellow-400" />
              Upgrade to Pro AI
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              Unlock deeper analytics and unlimited AI insights.
            </p>
          </div>

          <Button className="bg-violet-600 hover:bg-violet-700">
            Upgrade Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}