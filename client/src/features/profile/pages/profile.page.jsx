import { React, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import useUserAuthFlow from "@/features/auth/flows/userAuth.flow";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import {
  setAuthStep,
  selectOTPPurpose,
} from "../../auth/state/slices/auth.slice";

import { ResetPasswordDialog } from "@/features/auth/components/ResetPassword";

function ProfilePage() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { flow } = useUserAuthFlow();
  const otpPurpose = useSelector(selectOTPPurpose);

  let isForcedReset = true;

  if (otpPurpose != "password_reset") {
    isForcedReset = false;
  }

  const [manualOpen, setManualOpen] = useState(false);

  const openModal = isForcedReset || manualOpen;

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
        onClick={() => {
          setManualOpen(true);
        }}
        className="px-6 py-2 mt-10"
      >
        Open Reset Password Dialog
      </Button>

      {openModal && (
        <ResetPasswordDialog
          open={openModal}
          forcedReset={isForcedReset}
          onClose={() => !isForcedReset && setManualOpen(false)}
        />
      )}
    </div>
  );
}

export default ProfilePage;
