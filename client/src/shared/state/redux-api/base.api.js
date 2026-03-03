import { fetchBaseQuery } from "@reduxjs/toolkit/query";

import {
  selectAccessToken,
  setUpdateTokens,
  clearCredentials,
} from "@/features/auth/state/slices/auth.slice";

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

  if (result?.error?.status === 401) {
    console.log("Access token expired. Trying refresh...");

    const refreshResult = await baseQuery(
      {
        url: "/auth/refresh",
        method: "POST",
      },
      api,
      extraOptions,
    );

    if (refreshResult?.data) {
      api.dispatch(
        setUpdateTokens({ accessToken: refreshResult?.data.access_token }),
      );

      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

export { baseQueryWithReauth, baseQuery };
