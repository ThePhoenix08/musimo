import { React, useState } from "react";
import { Button } from "@/components/ui/button";
import useUserAuthFlow from "@/features/auth/flows/userAuth.flow";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import { setAuthStep } from "../../auth/state/slices/auth.slice";

import { ResetPasswordDialog } from "@/features/auth/components/ResetPassword";

function ProfilePage() {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const dispatch = useDispatch();
  const { flow } = useUserAuthFlow();

  const handleLogout = async () => {
    try {
      await flow("logout");

      dispatch(setAuthStep("register"));

      toast.success("Logout Successfully", {
        position: "top-right",
        autoClose: 1000,
        theme: "dark",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout Failed 😕", {
        position: "top-right",
        autoClose: 1000,
        theme: "dark",
      });
    }
  };

  return (
    <div className="flex flex-col">
      <h1>WELCOME USER</h1>
      <Button onClick={handleLogout}>LOGOUT</Button>

      <Button
        onClick={() => setIsResetDialogOpen(true)}
        className="px-6 py-2 mt-10"
      >
        Open Reset Password Dialog
      </Button>

      <ResetPasswordDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
      />
    </div>
  );
}

export default ProfilePage;
