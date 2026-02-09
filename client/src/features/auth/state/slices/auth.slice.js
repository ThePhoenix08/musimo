import { ENVS } from "@/shared/constants/env.constants";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isRefreshing: false,
  error: null,
  accessToken: null,
  tokenExpiryEstimate: null,
  preferThemeMode: "system",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
      state.error = null;
    },
    updateTokens: (state, action) => {
      const { accessToken } = action.payload;
      state.accessToken = accessToken;
      state.tokenExpiryEstimate = Date.now() + ENVS.ACCESS_TOKEN_EXPIRY;
    },
    clearCredentials: () => initialState,
    setLoading: (state, { payload }) => {
      state.isLoading = payload;
    },
    setRefreshing: (state, { payload }) => {
      state.isRefreshing = payload;
    },
    setError: (state, { payload }) => {
      state.error = payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, { payload }) => {
      if (state.user) {
        state.user = { ...state.user, ...payload };
      }
    },
    setPreferences: (state, { payload }) => {
      state.prefersDarkMode = payload;
    },
  },
});

export const {
  setCredentials,
  updateTokens,
  clearCredentials,
  setLoading,
  setRefreshing,
  setError,
  clearError,
  updateUser,
  setPreferences,
} = authSlice.actions;

export default authSlice.reducer;

// selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsRefreshing = (state) => state.auth.isRefreshing;
export const selectPreferences = (state) => state.auth.prefersThemeMode;

export const selectAccessToken = (state) => state.auth.accessToken;
export const selectTokenExpiryEstimate = (state) =>
  state.auth.tokenExpiryEstimate;
