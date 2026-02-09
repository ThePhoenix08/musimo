import { configureStore } from "@reduxjs/toolkit";

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

const persistConfig = {
  key: "root",
  storage,
  whiteList: ["auth"],
};

const persistAuthReducer = persistReducer(persistConfig);

const store = configureStore({
  reducer: {
    auth: persistAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Required for redux-persist + RTK Query to work together
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(),
  devTools: ENVS.DEV_MODE, // ✅ enables DevTools only in development
});

export const persistor = persistStore(store);
export default store;