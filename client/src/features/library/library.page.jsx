// import { useSearchParams } from "react-router";
import TopBar from "@/features/library/components/TopBar.jsx";
import FilterSidebar from "@/features/library/components/Filter/FilterSidebar";
import LibraryMenuBar from "@/features/library/components/LibraryMenuBar";

function LibraryPage() {
  // const [{ view }, setSearchParams] = useSearchParams();

  
  return <div className="library-page">
    <TopBar/>
    <div className="main-area flex">
      <div className="main-content-area">
        <LibraryMenuBar/>
        <div className="projects-area"></div>
      </div>
      <FilterSidebar/>
    </div>s
  </div>;
}
export default LibraryPage;
