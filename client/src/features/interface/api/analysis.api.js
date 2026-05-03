import { baseQueryWithReauth } from "@/shared/state/redux-api/base.api";
import { createApi } from "@reduxjs/toolkit/query/react";

export const AnalysisApi = createApi({
  reducerPath: "AnalysisApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["EmotionAnalysis", "InstrumentAnalysis"],
  endpoints: (builder) => ({
    getEmotionAnalysis: builder.query({
      query: (projectId) => `/analysis/emotion/${projectId}`,
      providesTags: (_r, _e, id) => [{ type: "EmotionAnalysis", id }],
    }),

    getInstrumentAnalysis: builder.query({
      query: (projectId) => `/analysis/instrument/${projectId}`,
      providesTags: (_r, _e, id) => [{ type: "InstrumentAnalysis", id }],
    }),
  }),
});

export const { useGetEmotionAnalysisQuery, useGetInstrumentAnalysisQuery } =
  AnalysisApi;
