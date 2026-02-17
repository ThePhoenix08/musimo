import { configureStore } from "@reduxjs/toolkit";

import { UserAuthenticationApi } from "@/features/auth/state/redux-api/auth.api";

import authReducer from "@/features/auth/state/slices/auth.slice";
import themeReducer from "../slices/theme.slice";

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { ENVS } from "@/shared/constants/env.constants.js";

const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: [
    "user",
    "accessToken",
    "authStep",
    "verificationEmail",
    "tokenExpiryEstimate",
    "isAuthenticated",
  ],
};

const themePersistConfig = {
  key: "theme",
  storage,
  whitelist: ["mode"],
};

const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer),
    theme: persistReducer(themePersistConfig, themeReducer),
    [UserAuthenticationApi.reducerPath]: UserAuthenticationApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Required for redux-persist + RTK Query to work together
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(UserAuthenticationApi.middleware),
  devTools: ENVS.DEV_MODE,
});

export const persistor = persistStore(store);
export default store;
