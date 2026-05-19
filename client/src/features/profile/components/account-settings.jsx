import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AccountSettings({
  setManualOpen,
}) {
  return (
    <Card className="border-white/10 bg-zinc-900/70">

      <CardHeader>
        <CardTitle>
          Account Settings
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        <Dialog>
          <DialogTrigger asChild>

            <Button className="gap-2">
              <Pencil className="h-4 w-4" />
              Update Profile
            </Button>
          </DialogTrigger>

          <DialogContent className="border-white/10 bg-zinc-900">

            <DialogHeader>

              <DialogTitle>
                Update Profile
              </DialogTitle>

              <DialogDescription>
                Edit your profile details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">

              <Input placeholder="Full Name" />

              <Input placeholder="Email Address" />

              <Button className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="secondary"
          onClick={() => setManualOpen(true)}
        >
          Reset Password
        </Button>
      </CardContent>
    </Card>
  );
}