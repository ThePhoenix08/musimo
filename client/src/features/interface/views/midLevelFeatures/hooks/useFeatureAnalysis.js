import { useEffect, useMemo, useRef } from "react";

import {
  useExtractAudioFeaturesMutation,
  useGetAudioFeatureAnalysisQuery,
} from "@/features/interface/api/analysis.api";

function useFeatureAnalysis(audioFileId) {
  const dbQuery = useGetAudioFeatureAnalysisQuery(audioFileId, {
    skip: !audioFileId,
  });


  const [extractFeatures, extractionState] = useExtractAudioFeaturesMutation();
  const hasTriggeredExtraction = useRef(false);
  const result = dbQuery.data;

  const isEmptyData =
    !result ||
    (Array.isArray(result) && result.length === 0) ||
    (typeof result === "object" &&
      Object.keys(result).length === 0);


  useEffect(() => {

    // only trigger once
    if (
      audioFileId &&
      !dbQuery.isLoading &&
      isEmptyData &&
      !hasTriggeredExtraction.current
    ) {
      hasTriggeredExtraction.current = true;

      extractFeatures({
        audioFileId,
      });
    }

  }, [
    audioFileId,
    dbQuery.isLoading,
    isEmptyData,
    extractFeatures,
  ]);

  // ---------------- REFETCH AFTER POST ----------------

  useEffect(() => {
    if (extractionState.isSuccess) {
      dbQuery.refetch();
    }
  }, [extractionState.isSuccess]);

 
  const loading =
    dbQuery.isLoading ||
    extractionState.isLoading;

  const source = useMemo(() => {

    if (extractionState.isLoading) {
      return "extracting";
    }

    if (!isEmptyData) {
      return "api";
    }

    return null;

  }, [
    extractionState.isLoading,
    isEmptyData,
  ]);

  return {
    loading,


    result,

    source,

    dbQuery,
    extractionState,
  };
}

export default useFeatureAnalysis;