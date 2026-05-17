import { useMemo } from "react";
import { useGetInstrumentAnalysisQuery } from "@/features/interface/api/analysis.api";
import { useInstrumentalAnalysisWebsocket } from "./useInstrumentalAnalysisWebsocket";

function useInstrumentAnalysis(projectId) {
  const dbQuery = useGetInstrumentAnalysisQuery(projectId, {
    skip: !projectId,
  });

  const isApiStatus404 = dbQuery.error?.status === 404;

  const shouldStartSocket = dbQuery.isError && isApiStatus404;

  const socket = useInstrumentalAnalysisWebsocket({
    projectId,
    enabled: shouldStartSocket,
    onCompleted: () => {
      dbQuery.refetch();
    },
  });

  const loading = dbQuery.isLoading || socket.running;

  const result = dbQuery.data?.data;

  const source = useMemo(() => {
    if (socket.running) return "socket";
    if (result) return "api";
    return null;
  }, [result, socket.running]);

  return {
    loading,
    result,
    source,
    socket,
    dbQuery,
  };
}

export default useInstrumentAnalysis;
