import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { FileUpload } from "@/components/ui/file-upload.jsx";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

const EmotionPredTest = () => {
  const [files, setFiles] = useState([]);
  const [predictionType, setPredictionType] = useState("static");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    // validation
    if (!files.length) {
      setError("Please upload an audio file.");
      return;
    }
    if (!predictionType) {
      setError("Please select a prediction type.");
      return;
    }

    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      setLoading(true);
      setError(null);
      setReport(null);

      if (["static", "dynamic", "combined"].indexOf(predictionType) === -1) {
        throw new Error("Invalid prediction type selected.");
      }

      const response = await fetch(
        `http://localhost:8000/debug/api/audio/predict-audio?prediction_type=${predictionType}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      setReport(result);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-4 p-4 border-2 border-gray-300 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Emotion Prediction Test</h2>

      <div className="flex h-full">
        <div className="w-1/2 border-r-2 border-gray-300 pr-4">
          <PredictionForm
            setFiles={setFiles}
            predictionType={predictionType}
            setPredictionType={setPredictionType}
            loading={loading}
            onPredict={handlePredict}
            error={error}
          />
        </div>

        <div className="w-1/2 pl-4">
          <AnalysisReport loading={loading} report={report} error={error} />
        </div>
      </div>
    </div>
  );
};

export default EmotionPredTest;

const PredictionForm = ({
  setFiles,
  predictionType,
  setPredictionType,
  loading,
  onPredict,
  error,
}) => {
  const handleFileUpload = (uploaded) => {
    setFiles(uploaded);
  };

  return (
    <div>
      <div className="w-full border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg mb-4">
        <FileUpload onChange={handleFileUpload} />
      </div>

      <PredictionTypeSelect
        value={predictionType}
        onChange={setPredictionType}
      />

      <Button onClick={onPredict} disabled={loading} className="mt-4">
        {loading ? "Processing..." : "Predict Emotion"}
      </Button>

      {error && <p className="text-red-500 mt-3 font-medium">{error}</p>}
    </div>
  );
};

const PredictionTypeSelect = ({ value, onChange }) => {
  return (
    <div className="predictionType mb-4">
      <label className="block mb-2 font-medium">Prediction Type:</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select prediction type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="static">Full Audio (Static)</SelectItem>
          <SelectItem value="dynamic">Every 5 Seconds (Dynamic)</SelectItem>
          <SelectItem value="combined">Both (Combined)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

const AnalysisReport = ({ loading, report, error }) => {
  const [activeTab, setActiveTab] = useState("static");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  const isStaticOnly = !!report?.emotions;
  const isDynamicOnly = !!report?.timestamps;

  const staticData = useMemo(() => {
    if (!report) return null;
    if (report.static) return report.static;
    if (report.emotions) return report;
    return null;
  }, [report]);

  const dynamicData = useMemo(() => {
    if (!report) return null;
    if (report.dynamic) return report.dynamic;
    if (report.timestamps) return report;
    return null;
  }, [report]);

  const handleSliderChange = (val) => {
    setCurrentIndex(val[0]);
  };

  const radarData = useMemo(() => {
    if (!report) return [];
    if (activeTab === "static" && staticData?.emotions) {
      return Object.entries(staticData.emotions).map(([emotion, value]) => ({
        emotion,
        probability: value,
      }));
    }
    if (activeTab === "dynamic" && dynamicData?.emotions) {
      return Object.entries(dynamicData.emotions).map(([emotion, values]) => ({
        emotion,
        probability: values[currentIndex] || 0,
      }));
    }
    return [];
  }, [report, activeTab, staticData, dynamicData, currentIndex]);

  const chartConfig = {
    probability: {
      label: "Emotion Probability:",
      color: "var(--chart-1)",
    },
  };

  const staticDisabled = isDynamicOnly;
  const dynamicDisabled = isStaticOnly;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (!dynamicData?.timestamps) return prev;
          if (prev < dynamicData.timestamps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false); // stop at end
            clearInterval(intervalRef.current);
            return prev;
          }
        });
      }, 800); // <- speed of autoplay (ms per step)
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, dynamicData]);

  const togglePlay = () => setIsPlaying((prev) => !prev);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Analysis Report</h3>
      <ScrollArea className="h-130 border-2 border-gray-300 p-3 rounded-md">
        {loading && <p>Analyzing...</p>}
        {!loading && !report && !error && (
          <p className="text-gray-500 italic">
            Upload a file and run prediction to view report.
          </p>
        )}
        {!loading && error && (
          <p className="text-red-500 font-medium">{error}</p>
        )}
        {!loading && report && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex gap-2 mb-4">
              <TabsTrigger value="static" disabled={staticDisabled}>
                Static
              </TabsTrigger>
              <TabsTrigger value="dynamic" disabled={dynamicDisabled}>
                Dynamic
              </TabsTrigger>
            </TabsList>

            {/* -------- Static Tab -------- */}
            <TabsContent value="static">
              {staticData ? (
                <RadarChartSection
                  title="Static Emotion Distribution"
                  description="Radar visualization of emotion probabilities for full audio"
                  radarData={radarData}
                  chartConfig={chartConfig}
                  metadata={staticData}
                />
              ) : (
                <p className="text-gray-500">No static data available.</p>
              )}
            </TabsContent>

            {/* -------- Dynamic Tab -------- */}
            <TabsContent value="dynamic">
              {dynamicData ? (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">
                        Timestamp:{" "}
                        {dynamicData.timestamps
                          ? dynamicData.timestamps[currentIndex].toFixed(2)
                          : 0}{" "}
                        sec
                      </label>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={togglePlay}
                        className="ml-4 flex items-center gap-1"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="h-4 w-4" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" /> Play
                          </>
                        )}
                      </Button>
                    </div>

                    <Slider
                      min={0}
                      max={
                        dynamicData.timestamps
                          ? dynamicData.timestamps.length - 1
                          : 0
                      }
                      step={1}
                      value={[currentIndex]}
                      onValueChange={handleSliderChange}
                    />
                  </div>

                  <RadarChartSection
                    title="Dynamic Emotion Distribution"
                    description="Emotion probabilities across audio segments"
                    radarData={radarData}
                    chartConfig={chartConfig}
                    metadata={dynamicData}
                  />
                </div>
              ) : (
                <p className="text-gray-500">No dynamic data available.</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </ScrollArea>
    </div>
  );
};

const RadarChartSection = ({
  title,
  description,
  radarData,
  chartConfig,
  metadata,
}) => {
  return (
    <Card className="">
      <CardHeader className="items-center pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 w-full">
        <ChartContainer config={chartConfig} className="max-h-70">
          <RadarChart data={radarData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent formatter={(value) => `${value.toFixed(2)}`} />}
            />
            <PolarGrid gridType="circle" />
            <PolarAngleAxis dataKey="emotion" />
            <Radar
              dataKey="probability"
              fill="var(--color-probability)"
              fillOpacity={0.6}
              dot={{ r: 4, fillOpacity: 1 }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1 text-sm">
        <MetadataSection data={metadata} />
      </CardFooter>
    </Card>
  );
};

// ---------- METADATA SECTION ----------
const MetadataSection = ({ data }) => (
  <div className="text-xs w-full">
    <p>
      <strong>Duration:</strong> {data.duration_seconds?.toFixed(2)} sec
    </p>
    {data.num_segments && (
      <p>
        <strong>Segments:</strong> {data.num_segments}
      </p>
    )}
    {data.segment_duration && (
      <p>
        <strong>Segment Duration:</strong> {data.segment_duration.toFixed(2)}{" "}
        sec
      </p>
    )}
    {data.model_version && (
      <p>
        <strong>Model Version:</strong> {data.model_version}
      </p>
    )}
  </div>
);
