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
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = selectAccessToken(getState());

    if (token && endpoint !== "refreshToken") {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (
      !headers.has("Content-Type") && headers.get("Content-Type") !== "multipart/form-data"
    ) {
      headers.set("Content-Type", "application/json");
    }
    return headers;
  },
});

// AUTO REAUTH
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status !== 401) {
    return result;
  }

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

  const newToken = refreshResult?.meta?.response?.headers
    .get("authorization")
    ?.replace("Bearer ", "");

  if (refreshResult?.data && newToken) {
    api.dispatch(setUpdateTokens({ accessToken: newToken }));
    result = await baseQuery(args, api, extraOptions);
  } else {
    api.dispatch(clearCredentials());
  }

  return result;
};

export { baseQueryWithReauth, baseQuery };
