import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import useUserAuthFlow from "@/features/auth/flows/userAuth.flow";

import {
  selectOTPPurpose,
  setAuthStep,
} from "@/features/auth/state/slices/auth.slice";

export default function useProfilePage() {
  const dispatch = useDispatch();

  const { flow } = useUserAuthFlow();

  const otpPurpose = useSelector(selectOTPPurpose);

  const [manualOpen, setManualOpen] = useState(false);

  const isForcedReset = otpPurpose === "password_reset";

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
      console.error(error);

      toast.error("Logout Failed 😕", {
        position: "top-right",
        autoClose: 1000,
        theme: "dark",
      });
    }
  };

  return {
    openModal,
    manualOpen,
    setManualOpen,
    isForcedReset,
    handleLogout,
  };
}