import { useMemo, useState, useEffect } from "react";
import { useGetEmotionAnalysisQuery } from "@/features/interface/api/analysis.api.js";
import { useEmotionAnalysisSocket } from "./useEmotionAnalysisWebsocket";

export function useEmotionAnalysis(projectId) {
  const [startSocket, setStartSocket] = useState(false);

  const query = useGetEmotionAnalysisQuery(projectId, { skip: !projectId });

  const api404 = query.isError && query.error?.status === 404;

  useEffect(() => {
    if (api404 && !startSocket) {
      () => setStartSocket(true);
    }
  }, [api404, startSocket]);

  const socket = useEmotionAnalysisSocket({
    projectId,
    enabled: startSocket && !query.data,
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
