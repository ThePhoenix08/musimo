import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { ROUTES } from "@/shared/constants/routes.constants";

import {
  setAuthStep,
  setVerificationEmail,
  setCredentials,
  clearCredentials,
  setUpdateTokens,
} from "../state/slices/auth.slice";

import {
  useRegisterMutation,
  useLoginMutation,
  useRequestOtpMutation,
  useLogoutMutation,
} from "../state/redux-api/auth.api";

import { requestOtpSchema } from "../validators/AuthApi.validator";

function useUserAuthFlow() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login] = useLoginMutation();
  const [register] = useRegisterMutation();
  const [requestOtp] = useRequestOtpMutation();
  const [logout] = useLogoutMutation();

  const flow = async (type, formData) => {
    try {
      if (type === "register") {
        const result = await register(formData).unwrap();

        const email = formData.get("email");
        dispatch(setVerificationEmail(email));

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

        dispatch(setAuthStep("otp"));
        return result;
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

        navigate(ROUTES.PROFILE);

        return result;
      }

      if (type === "logout") {
        await logout().unwrap();

        dispatch(clearCredentials());
        dispatch(setAuthStep("register"));

        navigate(ROUTES.LANDING_PAGE);
        return;
      }

      throw new Error(`No type ${type} flow available for role user.`);
    } catch (error) {
      console.error(`[AUTH ${type?.toUpperCase()} ERROR]:`, error);
      throw error;
    }
  };

  return { flow };
}

export default useUserAuthFlow;
