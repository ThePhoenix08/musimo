import { baseQuery } from "@/shared/state/redux-api/base.api";
import { createApi } from "@reduxjs/toolkit/query/react";

export const ProjectApi = createApi({
  reducerPath: "ProjectApi",
  baseQuery,
  tagTypes: ["Project"],
  endpoints: (builder) => ({
    createProject: builder.mutation({
      query: (projectData) => ({
        url: "/projects",
        method: "POST",
        body: projectData
      })
    })
  }),
})

export const {
  useCreateProjectMutation
} = ProjectApi;