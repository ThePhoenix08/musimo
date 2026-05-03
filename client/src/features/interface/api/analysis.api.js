// ============================================================
// FILE: src/store/api/analysisApi.ts
// RTK QUERY SLICE
// ============================================================

import { baseQueryWithReauth } from "@/shared/state/redux-api/base.api";
import { createApi } from "@reduxjs/toolkit/query/react";

export const AnalysisApi = createApi({
    reducerPath: "AnalysisApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["EmotionAnalysis"],
    endpoints: (builder) => ({
        getEmotionAnalysis: builder.query({
            query: (projectId) => `/analysis/emotion/${projectId}`,
            providesTags: (_r, _e, id) => [
                { type: "EmotionAnalysis", id },
            ],
        }),
    }),
});

export const {
    useGetEmotionAnalysisQuery
} = AnalysisApi;