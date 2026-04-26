import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  Music,
  Laugh,
  Scissors,
  Guitar,
  BarChart2,
  FileAudio,
  HardDrive,
  Gauge,
  Calendar,
} from "lucide-react";
import {
  selectProject,
  selectProjectError,
  selectProjectLoading,
} from "../../reducers/interface.slice";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";

const ANALYSIS_TYPES = [
  {
    id: "emotion",
    name: "Emotion Recognition",
    icon: Laugh,
  },
  {
    id: "instrument",
    name: "Instrument Recognition",
    icon: Guitar,
  },
  {
    id: "source",
    name: "Source Separation",
    icon: Scissors,
  },
  {
    id: "features",
    name: "Mid-level Feature Extraction",
    icon: BarChart2,
  },
];

const STATUS_CONFIG = {
  start: {
    label: "Start",
    badgeClass: "bg-primary text-primary-foreground",
    icon: Clock,
    progress: 0,
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-accent/15 text-accent-foreground",
    icon: CheckCircle2,
    progress: 100,
  },
};

function StatusPage({ changeTab }) {
  const response = useSelector(selectProject);
  const project = response?.data;
  const analysisStatus = {
    emotion_analysis_record: project?.emotion_analysis_record,
    instrument_analysis_record: project?.instrument_analysis_record,
    feature_analysis_record: project?.feature_analysis_record,
    separation_analysis_record: project?.separation_analysis_record,
  };
  const loading = useSelector(selectProjectLoading);
  const error = useSelector(selectProjectError);
  const audio = project?.main_audio;
  const audioName = audio?.file_name || "Audio File";

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading project data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          <p className="font-semibold">Error loading project</p>
        </div>
      </div>
    );
  }

  return (
    <div className="status-page p-4 max-w-7xl mr-auto bg-background">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          {project?.name}
        </h1>
        <p className="text-muted-foreground text-sm">{project?.description}</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Left Column - Audio Details */}
        <div className="lg:col-span-1">
          <Card className="border border-border overflow-hidden h-full">
            {/* Audio File Card Header */}
            <div className="bg-primary/10 p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary rounded-lg shrink-0">
                  <FileAudio className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Audio File
                  </p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {audioName}
                  </p>
                </div>
              </div>
            </div>

            {/* Audio Metadata */}
            <div className="p-4 space-y-4">
              {/* File Size */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg shrink-0">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    File Size
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatFileSize(audio?.file_size)}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg shrink-0">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Duration
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatDuration(audio?.duration)}
                  </p>
                </div>
              </div>

              {/* Format */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg shrink-0">
                  <Music className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Format
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {audio?.format || "N/A"}
                  </p>
                </div>
              </div>

              {/* Upload Date */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg shrink-0">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Uploaded
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {audio?.created_at
                      ? new Date(audio.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Analysis Status */}
        <div className="lg:col-span-2">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              Analysis Status
            </h2>
            <div className="space-y-3">
              {ANALYSIS_TYPES.map((analysis) => {
                const status =
                  analysisStatus[analysis.id] == null ? "start" : "completed";
                const statusConfig = STATUS_CONFIG[status];
                const StatusIcon = statusConfig.icon;
                const AnalysisIcon = analysis.icon;

                return (
                  <Card
                    key={analysis.id}
                    className="border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="p-4 flex items-center gap-4 min-w-0">
                      {/* Icon */}
                      <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                        <AnalysisIcon className="w-6 h-6 text-primary" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">
                            {analysis.name}
                          </h3>
                          <Button
                            className={`${statusConfig.badgeClass} flex items-center gap-1.5 px-3 py-1 text-xs font-medium shrink-0 cursor-pointer bg-primary/80 hover:bg-primary`}
                            onClick={() => changeTab(analysis.id)}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatusPage;
