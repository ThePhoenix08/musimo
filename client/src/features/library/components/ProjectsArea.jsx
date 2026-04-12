import { useGetAllProjectsQuery } from "@/features/library/actions/project.api.js";
import { useSearchParams } from "react-router";
import { LibraryPagination } from "@/features/library/components/LibraryPagination.jsx";
import ProjectCard from "./ProjectCard";

const ProjectsArea = () => {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("page_size")) || 20;

  const {
    data: response,
    isLoading,
    isError,
  } = useGetAllProjectsQuery({
    page,
    page_size: pageSize,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading projects</div>;

  const totalPages = Math.ceil((response.data?.total ?? 0) / pageSize);
  const items = response?.data?.items || [];

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {items?.map((p) => (
          <ProjectCard project={p} />
        ))}
      </div>
      <div className="flex justify-center items-center gap-4 mt-6">
        <LibraryPagination totalPages={totalPages} />
      </div>
    </div>
  );
};
export default ProjectsArea;
