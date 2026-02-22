import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useSelector } from "react-redux";
import { RefreshCwIcon, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { ROUTES } from "@/shared/constants/routes.constants";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";

import {
  useRequestOtpMutation,
  useVerifyOtpMutation,
} from "@/features/auth/state/redux-api/auth.api";
import {
  selectVerificationEmail,
  setCredentials,
  setUpdateTokens,
} from "@/features/auth/state/slices/auth.slice";

import {
  requestOtpSchema,
  verifyOtpSchema,
} from "../validators/AuthApi.validator";

export function InputOTPForm() {
  const [otp, setOtp] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [generalError, setGeneralError] = useState(null);

  const verificationEmail = useSelector(selectVerificationEmail);

  const [requestOtp, { isLoading: requestOtpLoading }] =
    useRequestOtpMutation();
  const [verifyOtp, { isLoading: verifyOtpLoading }] = useVerifyOtpMutation();

  const handleResendOTP = async () => {
    try {
      setGeneralError(null);

      const parsedFormData = {
        email: verificationEmail,
        purpose: "email_verification",
      };

      const zodResult = requestOtpSchema.safeParse(parsedFormData);

      if (!zodResult.success) {
        const zodError = zodResult.error.flatten().fieldErrors;
        console.error(`[RESEND OTP ERROR]:`, zodError);
        return;
      }

      await requestOtp({
        email: zodResult.data?.email,
        purpose: zodResult.data?.purpose,
      }).unwrap();

      toast.success("OTP Sent Successfully 🎉", {
        position: "top-right",
        autoClose: 1000,
        theme: "dark",
      });
    } catch (error) {
      console.error(`Failed to resend OTP: ${error?.data?.message}`);

      const backendMessage =
        error?.data?.message ||
        error?.data?.error?.message ||
        "Something went wroung";

      setGeneralError(backendMessage);

      toast.error("Failed to resend OTP 😕", {
        position: "top-right",
        autoClose: 1000,
        theme: "dark",
      });
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setGeneralError(null);

      const parsedFormData = {
        email: verificationEmail,
        purpose: "email_verification",
        code: otp,
      };

      const zodResult = verifyOtpSchema.safeParse(parsedFormData);

      if (!zodResult.success) {
        const zodError = zodResult.error.flatten().fieldErrors;
        console.error(`[VERIFY OTP ERROR]:`, zodError);
        return;
      }

      const result = await verifyOtp({
        email: zodResult.data?.email,
        purpose: zodResult.data?.purpose,
        code: zodResult.data?.code,
      }).unwrap();

      const { access_token } = result;
      const { user } = result.data;

      dispatch(setCredentials({ user }));

      dispatch(
        setUpdateTokens({
          accessToken: access_token,
        }),
      );

      navigate(ROUTES.PROFILE);

      toast.success("User Verified Successfully 🎉", {
        position: "top-right",
        autoClose: 1000,
        theme: "dark",
      });
    } catch (error) {
      console.error("OTP Verification Failed:", error);

      const backendMessage =
        error?.data?.message ||
        error?.data?.error?.message ||
        "Something went wroung";

      setGeneralError(backendMessage);

      toast.error("OTP Verification Failed 😕", {
        position: "top-right",
        autoClose: 1000,
        theme: "dark",
      });
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-1">
          <ShieldCheck /> Verify your login
        </CardTitle>
        <CardDescription>
          Enter the verification code we sent to your email address:{" "}
          <span className="font-medium">{verificationEmail}</span>.
        </CardDescription>
        {generalError && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-md text-sm">
            {generalError} 😟
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="otp-verification">
              Verification code
            </FieldLabel>
            <Button
              variant="outline"
              size="xs"
              onClick={handleResendOTP}
              disabled={requestOtpLoading}
            >
              <RefreshCwIcon />
              Resend Code
            </Button>
          </div>
          <InputOTP
            maxLength={6}
            id="otp-verification"
            required
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator className="mx-2" />
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </Field>
      </CardContent>
      <CardFooter>
        <Field>
          <Button
            type="button"
            onClick={handleVerifyOTP}
            disabled={verifyOtpLoading || otp.length !== 6}
            className="w-full flex items-center justify-center gap-2"
          >
            {verifyOtpLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {verifyOtpLoading ? "Processing..." : "Verify"}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
