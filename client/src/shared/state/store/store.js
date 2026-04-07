import { configureStore } from "@reduxjs/toolkit";

import { UserAuthenticationApi } from "@/features/auth/state/redux-api/auth.api";

import authReducer from "@/features/auth/state/slices/auth.slice";
import themeReducer from "../slices/theme.slice";
import interfaceReducer from "@/features/interface/reducers/interface.slice";

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
import { ProjectApi } from "@/features/library/actions/project.api";

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
    "otpPurpose",
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
    [ProjectApi.reducerPath]: ProjectApi.reducer,
    interface: interfaceReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Required for redux-persist + RTK Query to work together
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      .concat(UserAuthenticationApi.middleware)
      .concat(ProjectApi.middleware),
  devTools: ENVS.DEV_MODE,
});

export const persistor = persistStore(store);
export default store;
