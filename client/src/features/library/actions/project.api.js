import { baseQueryWithReauth } from "@/shared/state/redux-api/base.api";
import { createApi } from "@reduxjs/toolkit/query/react";

export const ProjectApi = createApi({
  reducerPath: "ProjectApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Project", "ProjectList"],
  endpoints: (builder) => ({
    createProject: builder.mutation({
      query: (projectData) => ({
        url: "/projects",
        method: "POST",
        body: projectData,
      }),
    }),
    getAllProjects: builder.query({
      query: ({ page = 1, page_size = 20 }) => ({
        url: `/projects?page=${page}&page_size=${page_size}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useCreateProjectMutation, useGetAllProjectsQuery } = ProjectApi;
