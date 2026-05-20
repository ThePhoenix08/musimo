import { useEffect, useState } from "react";
import { Pencil ,Key} from "lucide-react";
import { toast } from "react-toastify";
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

import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "../state/api/profile.api";

export default function AccountSettings({
  setManualOpen,
}) {
  const { data: profile } = useGetProfileQuery();
  const [updateProfile,{ isLoading },] = useUpdateProfileMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
    }

  }, [profile]);

  const handleUpdateProfile =
    async () => {

      try {
        const response =
          await updateProfile({
            name,
          }).unwrap();

        toast.success(
          response.message ||
          "Profile updated successfully",
          {
            position: "top-right",
            autoClose: 1000,
            theme: "dark",
          }
        );

        setOpen(false);

      } catch (error) {

        console.error(
          "Profile update error:",
          error
        );

        toast.error(
          "Failed to update profile",
          {
            position: "top-right",
            autoClose: 1000,
            theme: "dark",
          }
        );
      }
    };

  return (
    <Card className="border-white/10 bg-zinc-900/70">

      <CardHeader>

        <CardTitle>
          Account Settings
        </CardTitle>
      </CardHeader>

      <CardContent>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">

          <Dialog
            open={open}
            onOpenChange={setOpen}
          >

            <DialogTrigger asChild>

              <Button className="w-full gap-2 sm:w-auto">

                <Pencil className="h-4 w-4" />

                Update Profile
              </Button>
            </DialogTrigger>

            <DialogContent className="border-white/10 bg-zinc-900 text-white sm:max-w-md">

              <DialogHeader>

                <DialogTitle>
                  Update Profile
                </DialogTitle>

                <DialogDescription className="text-zinc-400">

                  Edit your profile details.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">

                <div className="space-y-2">

                  <label className="text-sm text-zinc-400">

                    Full Name
                  </label>

                  <Input
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    className="border-white/10 bg-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2">

                  <label className="text-sm text-zinc-400">

                    Email Address
                  </label>

                  <Input
                    placeholder="Email Address"
                    value={email}
                    disabled
                    className="border-white/10 bg-zinc-800 text-zinc-400"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={
                    handleUpdateProfile
                  }
                  disabled={
                    isLoading ||
                    !name.trim()
                  }
                >
                  {isLoading
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() =>
              setManualOpen(true)
            }
          >
            <Key className="h-4 w-4" />
            Reset Password
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}