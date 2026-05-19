import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DangerZone() {
  return (
    <Card className="border-red-500/20 bg-red-500/5">

      <CardHeader>

        <CardTitle className="text-red-400">
          Danger Zone
        </CardTitle>
      </CardHeader>

      <CardContent>

        <Button
          variant="destructive"
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Profile
        </Button>
      </CardContent>
    </Card>
  );
}