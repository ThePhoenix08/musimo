import { cn } from "@/lib/utils";
import { useState } from "react";
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

import { loginSchema } from "../validators/AuthApi.validator";

export function LoginForm({ className, ...props }) {
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
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input id="password" type="password" name="password" required />
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
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path
                d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.9-6.9C35.9 2.38 30.3 0 24 0 14.6 0 6.4 5.38 2.5 13.22l8.1 6.29C12.5 13.3 17.8 9.5 24 9.5zm23.5 14.5c0-1.55-.14-3.04-.4-4.5H24v9h13.5c-.58 3.04-2.32 5.62-4.94 7.34l7.6 5.9C44.6 37.7 47.5 31.4 47.5 24zM10.6 28.49a14.5 14.5 0 0 1 0-9.02l-8.1-6.29a24 24 0 0 0 0 21.6l8.1-6.29zM24 48c6.3 0 11.6-2.08 15.5-5.66l-7.6-5.9c-2.1 1.4-4.8 2.2-7.9 2.2-6.2 0-11.5-3.8-13.4-9.3l-8.1 6.29C6.4 42.62 14.6 48 24 48z"
                fill="currentColor"
              />
            </svg>
            Sign in with Google
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="/register" className="underline underline-offset-4">
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
