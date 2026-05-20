import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { clearCredentials } from "@/features/auth/state/slices/auth.slice";
import { useDispatch } from "react-redux";
import { useDeleteAccountMutation } from "../state/api/profile.api";
export default function DangerZone() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [
    deleteAccount,
    { isLoading },
  ] = useDeleteAccountMutation();
  const [confirmText, setConfirmText] =
    useState("");
  const handleDeleteAccount =
    async () => {

      if (confirmText !== "DELETE") {
        return;
      }
      try {

        await deleteAccount().unwrap();
        dispatch(clearCredentials());
        toast.success(
          "Account deleted successfully",
          {
            position: "top-right",
            autoClose: 1500,
            theme: "dark",
          }
        );

        navigate("/");

      } catch (error) {

        console.error(
          "Delete account error:",
          error
        );

        toast.error(
          "Failed to delete account",
          {
            position: "top-right",
            autoClose: 1500,
            theme: "dark",
          }
        );
      }
    };

  return (
    <Card className="border-red-500/20 bg-red-500/5">

      <CardHeader>

        <CardTitle className="text-red-400">
          Danger Zone
        </CardTitle>
      </CardHeader>

      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Profile
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-white/10 bg-zinc-900 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete Account?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 text-zinc-400">
                <p>
                  This action cannot be undone.
                  Your account and all related
                  data will be permanently deleted.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-red-400">
                    Type{" "}

                    <span className="font-semibold">
                      DELETE
                    </span>

                    {" "}to confirm.
                  </p>

                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) =>
                      setConfirmText(
                        e.target.value
                      )
                    }
                    placeholder="Type DELETE"
                    className="w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>

              <AlertDialogCancel>
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={
                  handleDeleteAccount
                }
                disabled={
                  isLoading ||
                  confirmText !== "DELETE"
                }
                className="bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading
                  ? "Deleting..."
                  : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}