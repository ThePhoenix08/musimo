import { baseQueryWithReauth } from "@/shared/state/redux-api/base.api";
import { createApi } from "@reduxjs/toolkit/query/react";

const PROJECT_LIST_TAG = { type: "Project", id: "LIST" };

export const ProjectApi = createApi({
  reducerPath: "ProjectApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Project"],
  endpoints: (builder) => ({
    createProject: builder.mutation({
      query: (projectData) => ({
        url: "/projects",
        method: "POST",
        body: projectData,
      }),
      invalidatesTags: [PROJECT_LIST_TAG],
    }),
    getAllProjects: builder.query({
      query: ({ page = 1, page_size = 20 }) => ({
        url: `/projects?page=${page}&page_size=${page_size}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.items.map(({ id }) => ({ type: "Project", id })),
              PROJECT_LIST_TAG,
            ]
          : [PROJECT_LIST_TAG],
    }),
    getProjectById: builder.query({
      query: ({ projectId }) => ({
        url: `/projects/${projectId}`,
        method: "GET",
      }),
      providesTags: (result, error, { projectId }) => [
        { type: "Project", id: projectId },
      ],
    }),
    deleteProjectById: builder.mutation({
      query: ({ projectId }) => ({
        url: `/projects/${projectId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Project", id: projectId },
        PROJECT_LIST_TAG,
      ],
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useGetAllProjectsQuery,
  useGetProjectByIdQuery,
  useDeleteProjectByIdMutation,
} = ProjectApi;
