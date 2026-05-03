"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setUpdateTokens,
  selectAccessToken,
} from "@/features/auth/state/slices/auth.slice";

const API_BASE = "/api";
const WS_BASE = "ws://localhost:8000/api/ws";

async function refreshAccessToken(dispatch) {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return null;

    const authHeader = res.headers.get("authorization");
    const body = await res.json().catch(() => null);

    const token = authHeader?.replace("Bearer ", "") || body?.accessToken;

    if (token) {
      dispatch(setUpdateTokens({ accessToken: token }));
      return token;
    }

    return null;
  } catch {
    return null;
  }
}

export function useInstrumentalAnalysisWebsocket({
  projectId,
  enabled,
  onCompleted,
}) {
  const wsRef = useRef(null);
  const dispatch = useDispatch();

  const token = useSelector(selectAccessToken);

  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !projectId) return;

    let closedByCleanup = false;

    const createSocket = (accessToken) => {
      const ws = new WebSocket(
        `${WS_BASE}/analyze-instrument/${projectId}?token=${accessToken}`,
      );

      ws.onopen = () => setConnected(true);

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "step_started":
          case "step_completed":
          case "progress_update":
          case "pipeline_completed":
            if (msg.all_steps) setSteps(msg.all_steps);
            if (typeof msg.overall_progress === "number") {
              setProgress(msg.overall_progress);
            }
            break;

          case "analysis_complete":
            setProgress(100);
            setRunning(false);
            onCompleted?.(msg.result);
            ws.close();
            break;

          case "error":
          case "pipeline_failed":
            if (
              msg.error?.toLowerCase?.().includes("token") ||
              msg.error?.toLowerCase?.().includes("unauthorized")
            ) {
              const newToken = await refreshAccessToken(dispatch);

              if (newToken && !closedByCleanup) {
                ws.close();
                const newSocket = createSocket(newToken);
                wsRef.current = newSocket;
                return;
              }
            }

            setError(msg.error || "Analysis failed");
            setRunning(false);
            ws.close();
            break;
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection failed");
        setRunning(false);
      };

      ws.onclose = () => {
        setConnected(false);
        if (!closedByCleanup) setRunning(false);
      };

      return ws;
    };

    const connect = async () => {
      setRunning(true);
      setError("");

      let validToken = token;

      if (!validToken) {
        validToken = await refreshAccessToken(dispatch);
      }

      const socket = createSocket(validToken);
      wsRef.current = socket;
    };

    connect();

    return () => {
      closedByCleanup = true;
      wsRef.current?.close();
    };
  }, [enabled, projectId, token, dispatch, onCompleted]);

  return { connected, running, progress, steps, error };
}
