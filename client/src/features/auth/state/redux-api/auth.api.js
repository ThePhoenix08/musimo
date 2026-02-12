import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/shared/state/redux-api/base.api";

export const UserAuthenticationApi = createApi({
  reducerPath: "userAuthenticationApi",
  baseQuery,
  tagTypes: ["Authentication"],
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (user) => ({
        url: "auth/register",
        method: "POST",
        body: user,
      }),
    }),

    login: builder.mutation({
      query: (user) => ({
        url: "auth/login",
        method: "POST",
        body: user,
      }),
    }),

    requestOtp: builder.mutation({
      query: (data) => ({
        url: "auth/otp/request-otp",
        method: "POST",
        body: data,
      }),
    }),

    verifyOtp: builder.mutation({
      query: (data) => ({
        url: "auth/otp/verify",
        method: "POST",
        body: data,
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useLogoutMutation,
} = UserAuthenticationApi;
