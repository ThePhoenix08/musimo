import React from "react";
import { Button } from "@/components/ui/button";
import useUserAuthFlow from "@/features/auth/flows/userAuth.flow";
import { toast } from "react-toastify";

function ProfilePage() {
  const { flow } = useUserAuthFlow();

  const handleLogout = async () => {
    try {
      await flow("logout");

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
    </div>
  );
}

export default ProfilePage;
