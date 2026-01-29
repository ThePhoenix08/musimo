import { LoginForm } from "../components/login-form";
import LogoText from "@/components/Brand/LogoText";
import EnhancedLoginRightSection from "../components/EnhancedLoginRightSection";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 dark:bg-black/70">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="w-full">
          <div className="box">
            <LogoText />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <EnhancedLoginRightSection />
    </div>
  );
}
