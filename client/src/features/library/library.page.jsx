import { useSearchParams } from "react-router";
import TopBar from "@/features/library/components/TopBar.jsx";
import FilterSidebar from "@/features/library/components/Filter/FilterSidebar";
import LibraryMenuBar from "@/features/library/components/LibraryMenuBar";
import CreateProjectDialog from "@/features/library/components/CreateProject/CreateProjectDialog.jsx";
function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const changeView = (newView) => {
    if (!["all", "create", "search"].includes(newView)) return;
    setSearchParams((prev) => ({ ...prev, view: newView }));
  };

  return (
    <div className="library-page">
      <CreateProjectDialog
        open={searchParams.get("view") == "create"}
        changeView={changeView}
      >
        <TopBar />
        <div className="main-area flex">
          <div className="main-content-area">
            <LibraryMenuBar />
            <div className="projects-area"></div>
          </div>
          <FilterSidebar />
        </div>
      </CreateProjectDialog>
    </div>
  );
}
export default LibraryPage;
