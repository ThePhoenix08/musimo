import { useParams, useSearchParams } from "react-router";
import { VALID_VIEWS } from "./data";
import NavTabs from "./components/navTabs";
import { Separator } from "@/components/ui/separator";
import StatusTab from "./views/status/Status.page";
import { useGetProjectByIdQuery } from "../library/actions/project.api";
import { useDispatch, useSelector } from "react-redux";
import { setError, setLoading, setProject } from "./reducers/interface.slice";
import { useEffect } from "react";
import EmotionPage from "./views/emotion/Emotion.page";
import InstrumentPage from "./views/instrument/pages/Instrument.page";
import FeaturesPage from "./views/midLevelFeatures/Features.page";
import SourceSeparationPage from "./views/sourceSeperation/SourceSeparation.page";
import AudioPlayerFooter from "./audio-player/AudioPlayerFooter.jsx";
import {
  selectPlayerMode,
  PLAYER_MODES,
} from "@/features/interface/audio-player/AudioPlayer.slice";
import { setAudioSource } from "./audio-player/AudioPlayer.slice";

const TAB_COMPONENTS = {
  status: StatusTab,
  emotion: EmotionPage,
  instrument: InstrumentPage,
  features: FeaturesPage,
  separate: SourceSeparationPage,
};

/** How much bottom padding to add per player mode so content isn't obscured. */
const FOOTER_HEIGHT = {
  [PLAYER_MODES.HIDDEN]: 0,
  [PLAYER_MODES.MINI]: 100, // h-16
  [PLAYER_MODES.NORMAL]: 144, // h-[144px]
  [PLAYER_MODES.EXPANDED]: 0, // expanded = full overlay, content hidden anyway
};

function InterfacePage() {
  const dispatch = useDispatch();
  const params = useParams();

  const { data, isLoading, error } = useGetProjectByIdQuery({
    projectId: params?.id,
  });

  useEffect(() => {
    dispatch(setLoading(isLoading));
    if (data) {
      dispatch(setProject(data));
      const { file_name, file_url } = data.data.main_audio;
      dispatch(
        setAudioSource({
          url: file_url,
          name: file_name,
          // duration: project.duration, // optional — will be set by the footer automatically
        }),
      );
    }
    if (error) dispatch(setError(error));
  }, [dispatch, data, isLoading, error]);

  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") || "status";

  const changeView = (newView) => {
    if (!VALID_VIEWS.some((v) => v.key === newView)) return;

    const p = new URLSearchParams(searchParams);
    p.set("view", newView);
    setSearchParams(p);
  };

  const ActiveTab = TAB_COMPONENTS[view] || StatusTab;
  const playerMode = useSelector(selectPlayerMode);
  const footerHeight = FOOTER_HEIGHT[playerMode] ?? 0;

  return (
    <div className="interface-page min-w-0 w-full">
      <div className="top-bar sticky top-12 h-12 px-4 border-y-2 py-1 flex w-full min-w-0 bg-background">
        <NavTabs currentTab={view} changeTab={changeView} />
        <Separator orientation="vertical" className="shrink-0" />
      </div>

      <div
        className="content w-full min-w-0 transition-[padding-bottom] duration-200"
        style={{ paddingBottom: footerHeight }}
      >
        <ActiveTab changeTab={changeView} />
      </div>

      <AudioPlayerFooter />
    </div>
  );
}

export default InterfacePage;
