"use client";

import { useMemo, useState } from "react";
import { useGetEmotionAnalysisQuery } from "@/features/interface/api/analysis.api.js";
import { useEmotionAnalysisSocket } from "./useEmotionAnalysisWebsocket";

export function useEmotionAnalysis(projectId) {
  const [startSocket, setStartSocket] = useState(false);

  const query = useGetEmotionAnalysisQuery(projectId);

  const socket = useEmotionAnalysisSocket({
    projectId,
    enabled: startSocket && query.isError,
    onCompleted: () => {
      query.refetch();
    },
  });

  const api404 = query.error?.status === 404;

  if (api404 && !startSocket) {
    setTimeout(() => {
      setStartSocket(true);
    }, 0);
  }

  const loading = query.isLoading || socket.running;

  const result = query.data?.data;

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
