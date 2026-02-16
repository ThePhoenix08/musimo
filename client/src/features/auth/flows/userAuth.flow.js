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

        dispatch(setVerificationEmail(formData.email));

        await requestOtp({
          email: formData.email,
          purpose: "email_verification",
        });

        dispatch(setAuthStep("otp"));
        return result;
      }

      if (type === "login") {
        const result = await login(formData).unwrap();

        dispatch(setCredentials(result.data));
        dispatch(setUpdateTokens(result.data));

        navigate(ROUTES.DASHBOARD);
        return result;
      }

      if (type === "logout") {
        await logout().unwrap();

        dispatch(clearCredentials());
        dispatch(setAuthStep("login"));

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
