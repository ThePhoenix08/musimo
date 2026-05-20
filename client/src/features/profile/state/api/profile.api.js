import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQueryWithReauth } from "@/shared/state/redux-api/base.api";

export const ProfileApi = createApi({
  reducerPath: "ProfileApi",

  baseQuery: baseQueryWithReauth,

  endpoints: (builder) => ({

    getProfile: builder.query({
      query: () => ({
        url: "user/profile",
        method: "GET",
      }),
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: "user/profile",
        method: "PUT",
        body,
      }),
    }),
    deleteAccount: builder.mutation({
      query: () => ({
        url: "user/account",
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteAccountMutation,
} = ProfileApi;