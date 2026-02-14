import { cn } from "@/lib/utils";
import { useState } from "react";
import useUserAuthFlow from "../flows/userAuth.flow";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { User, AtSign, Mail, Lock } from "lucide-react";

export function RegisterForm({ className, ...props }) {
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { flow } = useUserAuthFlow();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      await flow("register", data);

      toast.success("OTP Sent Successfully 🎉", {
        position: "top-right",
        autoClose: 1000,
        theme: "dark",
      }); 
    } catch (error) {
      console.error("Registration error:", error);

      const apiError = error?.data;

      // validation errors
      if (apiError?.errors && typeof apiError.errors === "object") {
        setErrors(apiError.errors);
      }
      toast.error("Registration Failed", {
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
        <div className="flex flex-col items-center gap-1 text-center mb-2">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Full Name
            </FieldLabel>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              disabled={isSubmitting}
              className={cn(
                errors.name &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {errors.name && (
              <p className="text-destructive text-xs mt-1.5 flex items-start gap-1">
                <span className="inline-block mt-0.5">⚠</span>
                <span>{errors.name}</span>
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="username" className="flex items-center gap-2">
              <AtSign className="w-4 h-4 text-primary" />
              Username
            </FieldLabel>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="john12"
              required
              disabled={isSubmitting}
              className={cn(
                errors.username &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {errors.username && (
              <p className="text-destructive text-xs mt-1.5 flex items-start gap-1">
                <span className="inline-block mt-0.5">⚠</span>
                <span>{errors.username}</span>
              </p>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Email
          </FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            disabled={isSubmitting}
            className={cn(
              errors.email &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {errors.email && (
            <p className="text-destructive text-xs mt-1.5 flex items-start gap-1">
              <span className="inline-block mt-0.5">⚠</span>
              <span>{errors.email}</span>
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Password
          </FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            disabled={isSubmitting}
            className={cn(
              errors.password &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {errors.password && (
            <p className="text-destructive text-xs mt-1.5 flex items-start gap-1">
              <span className="inline-block mt-0.5">⚠</span>
              <span>{errors.password}</span>
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
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            className="w-full"
            disabled={isSubmitting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5 mr-2"
            >
              <path
                d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.9-6.9C35.9 2.38 30.3 0 24 0 14.6 0 6.4 5.38 2.5 13.22l8.1 6.29C12.5 13.3 17.8 9.5 24 9.5zm23.5 14.5c0-1.55-.14-3.04-.4-4.5H24v9h13.5c-.58 3.04-2.32 5.62-4.94 7.34l7.6 5.9C44.6 37.7 47.5 31.4 47.5 24zM10.6 28.49a14.5 14.5 0 0 1 0-9.02l-8.1-6.29a24 24 0 0 0 0 21.6l8.1-6.29zM24 48c6.3 0 11.6-2.08 15.5-5.66l-7.6-5.9c-2.1 1.4-4.8 2.2-7.9 2.2-6.2 0-11.5-3.8-13.4-9.3l-8.1 6.29C6.4 42.62 14.6 48 24 48z"
                fill="currentColor"
              />
            </svg>
            Sign up with Google
          </Button>
          <FieldDescription className="px-6 text-center mt-4">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
