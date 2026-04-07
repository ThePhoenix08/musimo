import { fetchBaseQuery } from "@reduxjs/toolkit/query";

import {
  selectAccessToken,
  setUpdateTokens,
  clearCredentials,
} from "@/features/auth/state/slices/auth.slice";

export const BASE_URL = "/api/";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState, endpoint, body }) => {
    const token = selectAccessToken(getState());

    if (token && endpoint !== "refreshToken") {
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

  if (result?.error?.status === 401) {
    console.log("Access token expired. Trying refresh...");

    const refreshResult = await baseQuery(
      {
        url: "/auth/refresh",
        method: "POST",
        headers: {
          Authorization: undefined,
        },
      },
      api,
      extraOptions,
    );

    const headers = refreshResult?.meta?.response?.headers;

    if (refreshResult?.data) {
      api.dispatch(
        setUpdateTokens({
          accessToken: headers.get("authorization")?.replace("Bearer ", ""),
        }),
      );

      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

export { baseQueryWithReauth, baseQuery };
