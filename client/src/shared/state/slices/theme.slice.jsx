import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "system",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeMode: (state, action) => {
      const allowedModes = ["light", "dark", "system"];

      if (allowedModes.includes(action.payload)) {
        state.mode = action.payload;
      }
    },
    setToggleThemeMode: (state) => {
      if (state.mode === "light") {
        state.mode = "dark";
      } else if (state.mode === "dark") {
        state.mode = "system";
      } else {
        state.mode = "light";
      }
    },
  },
});

export const { setThemeMode, setToggleThemeMode } = themeSlice.actions;
export const selectThemeMode = (state) => state.theme.mode;

export default themeSlice.reducer;
  