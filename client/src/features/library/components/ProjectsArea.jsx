import { useGetAllProjectsQuery } from "@/features/library/actions/project.api.js";
import { useSearchParams } from "react-router";
import { LibraryPagination } from "@/features/library/components/LibraryPagination.jsx";
import ProjectCard from "./ProjectCard";
import { CardSkeleton } from "@/shared/providers/card.skeleton";

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

  if (isLoading) return <div><CardSkeleton /></div>;
  if (isError) return <div>Error loading projects</div>;

  const items = response?.data?.items || [];

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 p-5">
        {items?.map((p) => (
          <ProjectCard project={p} key={p.id}/>
        ))}
      </div>
    </div>
  );
};
export default ProjectsArea;
