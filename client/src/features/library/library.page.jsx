import { useSearchParams } from "react-router";
import TopBar from "@/features/library/components/TopBar.jsx";
import CreateProjectDialog from "@/features/library/components/CreateProject/CreateProjectDialog.jsx";
import ProjectsArea from "./components/ProjectsArea";
function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const changeView = (newView) => {
    if (!["all", "create", "search"].includes(newView)) return;
    setSearchParams((prev) => ({ ...prev, view: newView }));
  };

  return (
    <div className="library-page w-full h-full overflow-x-hidden overflow-y-auto">
      <CreateProjectDialog
        open={searchParams.get("view") == "create"}
        changeView={changeView}
      >
        <div className="main-area flex">
          <div className="main-content-area">
            <ProjectsArea />
          </div>
        </div>
      </CreateProjectDialog>
    </div>
  );
}
export default LibraryPage;
