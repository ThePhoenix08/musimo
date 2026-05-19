import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Switch } from "@/components/ui/switch";

export default function PreferencesSettings() {
  return (
    <Card className="border-white/10 bg-zinc-900/70">

      <CardHeader>
        <CardTitle>
          Preferences
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        <div className="flex items-center justify-between">

          <div>
            <h4 className="font-medium">
              Stop Notifications
            </h4>

            <p className="text-sm text-zinc-500">
              Disable email & push notifications
            </p>
          </div>

          <Switch />
        </div>

        <div className="flex items-center justify-between">

          <div>
            <h4 className="font-medium">
              Dark Theme
            </h4>

            <p className="text-sm text-zinc-500">
              Toggle dashboard theme
            </p>
          </div>

          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}