"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { setAuthStep } from "../state/slices/auth.slice";

import { Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";

export function ForgotPassword() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    setIsSubmitted(true);

    // Reset after 4 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail("");
    }, 4000);
  };

  return (
    <div>
      <Card className="w-full bg-card/95 backdrop-blur-sm p-8 shadow-xl relative z-10">
        <div className="space-y-7">
          {/* Icon with animation */}
          <div className="flex justify-center">
            <div className="relative h-20 w-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 group hover:border-primary/40 transition-all duration-300">
              <div className="absolute inset-0 rounded-2xl bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
              <Lock className="h-10 w-10 text-primary relative" />
            </div>
          </div>
          {/* Title and Description */}
          <div className="space-y-2.5 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Forgot Password?
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              No worries! Enter your email address and we'll send you a link to
              reset your password.
            </p>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitted}
                className="pl-12 h-12 bg-background/50 border-border/50 text-base placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background/80 transition-all duration-200"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isSubmitted || !email}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : isSubmitted ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Email Sent!</span>
                </>
              ) : (
                <>
                  <span>Send Reset OTP</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </>
              )}
            </Button>
          </form>
          <FieldDescription className="px-6 text-center mt-4">
            Remember your password?{" "}
            <button
              onClick={() => {
                dispatch(setAuthStep("register"));
              }}
              className="text-primary underline underline-offset-4 font-medium hover:cursor-pointer"
            >
              Sign In
            </button>
          </FieldDescription>
        </div>
      </Card>
    </div>
  );
}
