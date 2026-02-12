import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { ROUTES } from "@/shared/constants/routes.constants";

import {
  setAuthStep,
  setVerificationEmail,
  setCredentials,
} from "../state/slices/auth.slice";

import {
  useRegisterMutation,
  useLoginMutation,
  useRequestOtpMutation,
} from "../state/redux-api/auth.api";

function useUserAuthFlow() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login] = useLoginMutation();
  const [register] = useRegisterMutation();
  const [requestOtp] = useRequestOtpMutation();

  const flow = async (type, formData) => {
    try {
      let apiCall;

      if (type === "login") {
        apiCall = login;
      } else if (type === "register") {
        apiCall = register;
      } else {
        throw new Error(`No type ${type} flow available for role user.`);
      }

      const result = await apiCall(formData).unwrap();

      if (type === "register") {
        dispatch(setVerificationEmail(formData.email));
        
        await requestOtp({
          email: formData.email,
          purpose: "email_verification",
        });

        dispatch(setAuthStep("otp"));
        return result;
      }

      if (type === "login") {
        dispatch(setCredentials(result.data));
      }

      navigate(ROUTES.DASHBOARD);
      return result;
    } catch (error) {
      console.error(`[AUTH ${type?.toUpperCase()} ERROR]:`, error);
      throw error;
    }
  };

  return { flow };
}

export default useUserAuthFlow;
