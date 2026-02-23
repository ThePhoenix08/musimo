import { fetchBaseQuery } from "@reduxjs/toolkit/query";

import { selectAccessToken } from "@/features/auth/state/slices/auth.slice";

export const BASE_URL = "http://127.0.0.1:8000/";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState, /* _endpoint, */ body }) => {
    const token = selectAccessToken(getState());

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    return headers;
  },
});

// AUTO REAUTH
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // If access token expired
  if (result?.error?.status === 401) {
    console.log("Access token expired. Trying refresh...");

    // Try refreshing token
    // const refreshResult = await baseQuery(
    //   {
    //     url: "/auth/refresh",
    //     method: "POST",
    //   },
    //   api,
    //   extraOptions,
    // );

    // if (refreshResult?.data) {
    //   // Save new access token
    //   api.dispatch(setCredentials(refreshResult.data));

    //   // Retry original request
    //   result = await baseQuery(args, api, extraOptions);
    // } else {
    //   // Refresh failed → logout user
    //   api.dispatch(logout());
    // }
  }

  return result;
};

export { baseQueryWithReauth, baseQuery };
