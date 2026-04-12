import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Music,
  Zap,
  Brain,
  Radio,
  FileAudio,
  HardDrive,
  Gauge,
  Calendar,
  Loader,
} from "lucide-react";
import {
  selectProject,
  selectProjectError,
  selectProjectLoading,
} from "../../reducers/interface.slice";
import { useSelector } from "react-redux";

const ANALYSIS_TYPES = [
  {
    id: "emotion",
    name: "Emotion Recognition",
    icon: Brain,
  },
  {
    id: "instrument",
    name: "Instrument Recognition",
    icon: Music,
  },
  {
    id: "source",
    name: "Source Separation",
    icon: Zap,
  },
  {
    id: "features",
    name: "Mid-level Feature Extraction",
    icon: Radio,
  },
];

const STATUS_CONFIG = {
  not_started: {
    label: "Not Started",
    badgeClass: "bg-muted text-muted-foreground",
    icon: Clock,
    progress: 0,
  },
  in_progress: {
    label: "Processing",
    badgeClass: "bg-primary/15 text-primary",
    icon: Loader,
    progress: 60,
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-accent/15 text-accent-foreground",
    icon: CheckCircle2,
    progress: 100,
  },
  failed: {
    label: "Failed",
    badgeClass: "bg-destructive/15 text-destructive",
    icon: AlertCircle,
    progress: 0,
  },
};

function StatusPage() {
  const response = useSelector(selectProject);
  const project = response?.data;
  const analysisStatus = {};
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
    return `${mins}m ${secs}s`;
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
                const status = analysisStatus[analysis.id] || "not_started";
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
                          <Badge
                            className={`${statusConfig.badgeClass} flex items-center gap-1.5 px-3 py-1 text-xs font-medium shrink-0`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={statusConfig.progress}
                            className="h-2 flex-1"
                          />
                          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap shrink-0">
                            {statusConfig.progress}%
                          </span>
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
