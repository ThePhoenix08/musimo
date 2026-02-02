import { RegisterForm } from "@/features/auth/components/register-form";
import LogoText from "@/components/Brand/LogoText";
import EnhancedRegisterRightSection from "@/features/auth/components/EnhancedRegisterRightSection";

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 w-screen overflow-hidden dark:bg-black/70">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="w-full">
          <div className="box">
            <LogoText />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterForm />
          </div>
        </div>
      </div>
      <EnhancedRegisterRightSection />
    </div>
  );
}
