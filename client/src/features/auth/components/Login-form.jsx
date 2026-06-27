import { cn } from "@/lib/utils";
import { useState } from "react";
import { useDispatch } from "react-redux";

import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useUserAuthFlow from "../flows/userAuth.flow";
import { Link } from "react-router";
import { setAuthStep } from "../../auth/state/slices/auth.slice";

import { loginSchema } from "../validators/AuthApi.validator";

export function LoginForm({ className, ...props }) {
  const dispatch = useDispatch();

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { flow } = useUserAuthFlow();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    const formData = new FormData(e.target);

    const parsedFormData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const zodResult = loginSchema.safeParse(parsedFormData);

    if (!zodResult.success) {
      isSubmitting(false);
      const zodError = zodResult.error.flatten().fieldErrors;
      setErrors(zodError);
      console.error(`[LOGIN VALIDATION ERROR]:`, zodError);
      return;
    }

    const apiFormData = new FormData();
    apiFormData.append("email", zodResult.data?.email);
    apiFormData.append("password", zodResult.data?.password);

    try {
      await flow("login", apiFormData);

      toast.success("User LoggedIn Successfully 🎉", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } catch (error) {
      console.error("Login error:", error);

      const backendMessage =
        error?.data?.message ||
        error?.data?.error?.message ||
        "Something went wroung";

      setGeneralError(backendMessage);

      toast.error("Login Failed 😕", {
        position: "top-right",
        autoClose: 1000,
        theme: "dark",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        {generalError && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-md text-sm">
            {generalError} 😟
          </div>
        )}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="m@example.com"
            required
            autocomplete
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1.5 flex items-start gap-1">
              <span className="inline-block mt-0.5">⚠</span>
              <span>{errors.email[0]}</span>
            </p>
          )}
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <button
              onClick={() => dispatch(setAuthStep("forgotPassword"))}
              className="ml-auto text-sm underline underline-offset-4 hover:cursor-pointer text-primary"
            >
              Forgot your password?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            name="password"
            required
            autocomplete
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1.5 flex items-start gap-1">
              <span className="inline-block mt-0.5">⚠</span>
              <span>{errors.password[0]}</span>
            </p>
          )}
        </Field>
        <Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging In...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-primary underline underline-offset-4"
            >
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
