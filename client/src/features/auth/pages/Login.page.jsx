import { LoginForm } from "../components/login-form";
import LogoText from "@/components/Brand/LogoText";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";

import { ROUTES } from "../../../shared/constants/routes.constants";

import EnhancedLoginRightSection from "../components/EnhancedLoginRightSection";
import {
  selectIsAuthenticated,
  selectAuthStep,
} from "../state/slices/auth.slice";
import { ForgotPassword } from "@/features/auth/components/ForgotPassword";

export default function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authStep = useSelector(selectAuthStep);

  if (isAuthenticated) {
    return navigate(ROUTES.PROFILE);
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2 dark:bg-black/70">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="w-full">
          <div className="box">
            <LogoText />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            {authStep === "forgotPassword" ? <ForgotPassword /> : <LoginForm />}
          </div>
        </div>
      </div>
      <EnhancedLoginRightSection />
    </div>
  );
}
