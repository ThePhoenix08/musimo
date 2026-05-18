// scr/features/interface/api/analysis.api.js
import { baseQueryWithReauth } from "@/shared/state/redux-api/base.api";
import { createApi } from "@reduxjs/toolkit/query/react";

export const AnalysisApi = createApi({
  reducerPath: "AnalysisApi",
  baseQuery: baseQueryWithReauth,

  tagTypes: ["EmotionAnalysis", "InstrumentAnalysis", "AudioFeatures"],

  endpoints: (builder) => ({
    getEmotionAnalysis: builder.query({
      query: (projectId) => `/analysis/emotion/${projectId}`,

      providesTags: (_r, _e, id) => [{ type: "EmotionAnalysis", id }],
    }),

    getInstrumentAnalysis: builder.query({
      query: (projectId) => `/analysis/instrument/${projectId}`,

      providesTags: (_r, _e, id) => [{ type: "InstrumentAnalysis", id }],
    }),

    getAudioFeatureAnalysis: builder.query({
      query: (audioFileId) =>
        `/audio/audio-feature/list?audio_file_id=${audioFileId}`,

      transformResponse: (response) => {
        return response?.data?.[0] || null;
      },

      providesTags: (_r, _e, id) => [
        { type: "AudioFeatures", id },
      ],
    }),

    extractAudioFeatures: builder.mutation({
      query: ({ audioFileId }) => ({
        url: `/audio/audio-feature/extract?audio_file_id=${audioFileId}`,
        method: "POST",
      }),

      invalidatesTags: (_r, _e, arg) => [
        { type: "AudioFeatures", id: arg.audioFileId },
      ],
    }),
  }),
});

export const {useGetEmotionAnalysisQuery, useGetInstrumentAnalysisQuery,
  useGetAudioFeatureAnalysisQuery, useExtractAudioFeaturesMutation,
} = AnalysisApi;