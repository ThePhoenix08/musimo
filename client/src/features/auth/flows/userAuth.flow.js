import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { ROUTES } from "@/shared/constants/routes.constants";

import {
  setAuthStep,
  setVerificationEmail,
  setCredentials,
  clearCredentials,
  setUpdateTokens,
  setOtpPurpose,
} from "../state/slices/auth.slice";

import {
  useRegisterMutation,
  useLoginMutation,
  useRequestOtpMutation,
  useLogoutMutation,
  useResetPasswordMutation,
} from "../state/redux-api/auth.api";

import { requestOtpSchema } from "../validators/AuthApi.validator";

import { toast } from "react-toastify";

function isAuthError(error) {
  const status = error?.status ?? error?.data?.status;
  return status === 401 || status === 403;
}

function useUserAuthFlow() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login] = useLoginMutation();
  const [register] = useRegisterMutation();
  const [requestOtp] = useRequestOtpMutation();
  const [logout] = useLogoutMutation();
  const [resetPassword] = useResetPasswordMutation();

  const flow = async (type, formData) => {
    try {
      if (type === "register") {
        const result = await register(formData).unwrap();

        const parsedFormData = {
          email: formData.get("email"),
          purpose: "email_verification",
        };

        const zodResult = requestOtpSchema.safeParse(parsedFormData);

        if (!zodResult.success) {
          const zodError = zodResult.error.flatten().fieldErrors;
          console.error(`[REQUEST OTP ERROR]:`, zodError);
          return;
        }

        await requestOtp({
          email: zodResult.data?.email,
          purpose: zodResult.data?.purpose,
        }).unwrap();

        dispatch(setVerificationEmail(zodResult.data?.email));
        dispatch(setOtpPurpose("email_verification"));

        dispatch(setAuthStep("otp"));
        return result;
      }

      if (type === "forgotPassword") {
        const parsedFormData = {
          email: formData.get("email"),
          purpose: "password_reset",
        };

        const zodResult = requestOtpSchema.safeParse(parsedFormData);

        if (!zodResult.success) {
          const zodError = zodResult.error.flatten().fieldErrors;
          console.error(`[REQUEST OTP ERROR]:`, zodError);

          throw { type: "Validation", errors: zodError };
        }

        await requestOtp({
          email: zodResult.data?.email,
          purpose: zodResult.data?.purpose,
        }).unwrap();

        dispatch(setVerificationEmail(zodResult.data?.email));
        dispatch(setOtpPurpose("password_reset"));

        dispatch(setAuthStep("otp"));
        toast.success("OTP Sent Successfully 🎉", {
          position: "top-right",
          autoClose: 1000,
          theme: "dark",
        });
        return;
      }

      if (type === "login") {
        const result = await login(formData).unwrap();

        const { access_token } = result;
        const { user } = result.data;

        dispatch(setCredentials({ user }));
        dispatch(
          setUpdateTokens({
            accessToken: access_token,
          }),
        );

        navigate(ROUTES.PROFILE, { replace: true });

        return result;
      }

      if (type === "logout") {
        await logout().unwrap();

        dispatch(clearCredentials());
        dispatch(setAuthStep("register"));

        navigate(ROUTES.LANDING_PAGE, { replace: true });
        return;
      }

      if (type === "resetPassword") {
        await resetPassword(formData).unwrap();

        dispatch(setOtpPurpose(null));

        toast.success("Password Reset Successfully 🎉", {
          position: "top-right",
          autoClose: 1000,
          theme: "dark",
        });
        return;
      }

      throw new Error(`No type ${type} flow available for role user.`);
    } catch (error) {
      console.error(`[AUTH ${type?.toUpperCase()} ERROR]:`, error);
      if (isAuthError(error)) {
        dispatch(clearCredentials());
        dispatch(setAuthStep("login"));
        navigate("/login");
      }
      throw error;
    }
  };

  return { flow };
}

export default useUserAuthFlow;
