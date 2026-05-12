import { useMemo } from "react";
import { useGetEmotionAnalysisQuery } from "@/features/interface/api/analysis.api.js";
import { useEmotionAnalysisSocket } from "./useEmotionAnalysisWebsocket";

export function useEmotionAnalysis(projectId) {
  const query = useGetEmotionAnalysisQuery(projectId, { skip: !projectId });

  const api404 =
    query.error?.status === 404 ||
    query?.data?.error?.code === "HTTP_404";

  const socket = useEmotionAnalysisSocket({
    projectId,
    enabled: api404 && !query.data,
    onCompleted: () => {
      query.refetch();
    },
  });

  const loading = query.isLoading || socket.running;
  const result = query.data?.data ?? null;

  const source = useMemo(() => {
    if (result) return "api";
    if (socket.running) return "socket";
    return null;
  }, [result, socket.running]);

  return {
    loading,
    result,
    source,
    socket,
    query,
  };
}
