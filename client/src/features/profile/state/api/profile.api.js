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

  }),
});

export const {
  useGetProfileQuery,
} = ProfileApi;