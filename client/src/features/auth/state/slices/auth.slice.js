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
  authStep: "register",
  verificationEmail: null,
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
    setAuthStep: (state, { payload }) => {
      state.authStep = payload;
    },
    setVerificationEmail: (state, { payload }) => {
      state.auth.verificationEmail = payload;
    },
    setUpdateTokens: (state, action) => {
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
    setClearError: (state) => {
      state.error = null;
    },
    setUpdateUser: (state, { payload }) => {
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
  setUpdateTokens,
  clearCredentials,
  setLoading,
  setRefreshing,
  setError,
  setClearError,
  setUpdateUser,
  setPreferences,
  setAuthStep,
  setVerificationEmail,
} = authSlice.actions;

export default authSlice.reducer;

// selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsRefreshing = (state) => state.auth.isRefreshing;
export const selectPreferences = (state) => state.auth.prefersThemeMode;
export const selectAuthStep = (state) => state.auth.authStep;
export const selectVerificationEmail = (state) => state.auth.verificationEmail;

export const selectAccessToken = (state) => state.auth.accessToken;
export const selectTokenExpiryEstimate = (state) =>
  state.auth.tokenExpiryEstimate;
