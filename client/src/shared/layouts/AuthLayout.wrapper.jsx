import React from "react";
import { Outlet, Navigate } from "react-router";
import { useSelector } from "react-redux";

import {
  selectIsAuthenticated,
  selectAccessToken,
} from "@/features/auth/state/slices/auth.slice";
import { ROUTES } from "@/shared/constants/routes.constants";

function AuthLayout() {
  // const isUserAuthenticated = useSelector(selectIsAuthenticated);
  // const userAccessToken = useSelector(selectAccessToken);

  // if (!isUserAuthenticated || !userAccessToken) {
  //   return <Navigate to={ROUTES.LOGIN} replace />;
  // }

  return <Outlet />;
}

export default AuthLayout;
