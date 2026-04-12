import { useParams, useSearchParams } from "react-router";
import { VALID_VIEWS } from "./data";
import NavTabs from "./components/navTabs";
import { Separator } from "@/components/ui/separator";
import StatusTab from "./views/status/Status.page";
import { useGetProjectByIdQuery } from "../library/actions/project.api";
import { useDispatch } from "react-redux";
import { setError, setLoading, setProject } from "./reducers/interface.slice";
import { useEffect } from "react";
import EmotionPage from "./views/emotion/Emotion.page";
import InstrumentPage from "./views/instrument/Instrument.page";
import FeaturesPage from "./views/midLevelFeatures/Features.page";
import SourceSeparationPage from "./views/sourceSeperation/SourceSeparation.page";

const TAB_COMPONENTS = {
  status: StatusTab,
  emotion: EmotionPage,
  instrument: InstrumentPage,
  features: FeaturesPage,
  separate: SourceSeparationPage,
};

function InterfacePage() {
  const dispatch = useDispatch();
  const params = useParams();

  const { data, isLoading, error } = useGetProjectByIdQuery({
    projectId: params?.id,
  });

  useEffect(() => {
    dispatch(setLoading(isLoading));
    if (data) dispatch(setProject(data));
    if (error) dispatch(setError(error));
  }, [dispatch, data, isLoading, error]);

  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") || "status";

  const changeView = (newView) => {
    if (!VALID_VIEWS.some((v) => v.key === newView)) return;

    const params = new URLSearchParams(searchParams);
    params.set("view", newView);

    setSearchParams(params);
  };

  const ActiveTab = TAB_COMPONENTS[view] || StatusTab;

  return (
    <div className="interface-page min-w-0 w-full">
      <div className="top-bar px-4 border-y-2 py-1 flex w-full min-w-0">
        <NavTabs currentTab={view} changeTab={changeView} />
        <Separator orientation="vertical" className="shrink-0" />
      </div>
      <div className="content w-full min-w-0">
        <ActiveTab />
      </div>
    </div>
  );
}
export default InterfacePage;
