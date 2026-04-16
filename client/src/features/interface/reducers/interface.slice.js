import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  project: null,
  loading: false,
  error: null,
};

const interfaceSlice = createSlice({
  name: "interface",
  initialState,
  reducers: {
    setProject: (state, action) => {
      state.project = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setProject, setLoading, setError } = interfaceSlice.actions;
export default interfaceSlice.reducer;

export const selectProject = (state) => state.interface.project;
export const selectProjectLoading = (state) => state.interface.loading;
export const selectProjectError = (state) => state.interface.error;
