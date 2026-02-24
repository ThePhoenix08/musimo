import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { ROUTES } from "../../../shared/constants/routes.constants";

import { RegisterForm } from "@/features/auth/components/register-form";
import { InputOTPForm } from "../components/OTP-form";
import LogoText from "@/components/Brand/LogoText";
import EnhancedRegisterRightSection from "@/features/auth/components/EnhancedRegisterRightSection";

import {
  selectAuthStep,
  selectIsAuthenticated,
} from "@/features/auth/state/slices/auth.slice";

export default function SignupPage() {
  const navigate = useNavigate();
  const authStep = useSelector(selectAuthStep);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return navigate(ROUTES.PROFILE);
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2 w-screen overflow-hidden overflow-y-scroll dark:bg-black/70">
      <div className="flex flex-col gap-4 p-6 md:p-10 lg:p-12">
        <div className="w-full">
          <div className="box">
            <LogoText />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            {authStep === "register" && <RegisterForm />}
            {authStep === "otp" && <InputOTPForm />}
          </div>
        </div>
      </div>
      <EnhancedRegisterRightSection />
    </div>
  );
}
