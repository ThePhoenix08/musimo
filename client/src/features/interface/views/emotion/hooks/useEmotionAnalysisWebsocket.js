// ============================================================
// FILE: src/hooks/useEmotionAnalysisSocket.js
// WEBSOCKET HOOK WITH AUTO REFRESH TOKEN SUPPORT
// ============================================================

"use client";

import { clearCredentials, selectAccessToken, setUpdateTokens } from "@/features/auth/state/slices/auth.slice";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";


const API_BASE = "/api";

function getWsBase() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ws`;
}

async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;
    const header = res.headers.get("authorization");
    return header?.replace("Bearer ", "") ?? null;
  } catch {
    return null;
  }
}

export function useEmotionAnalysisSocket({
  projectId,
  enabled,
  onCompleted,
}) {
  const dispatch = useDispatch();

  const reduxToken = useSelector(selectAccessToken);
  const wsRef = useRef(null);
  const onCompletedRef = useRef(onCompleted);

  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {onCompletedRef.current = onCompleted}, [onCompleted]);

  useEffect(() => {
    if (!enabled || !projectId) return;

    let isCancelled = false;

    const connect = async (token) => {
      if (isCancelled) return;

      setError("");
      setRunning(true);

      const WS_BASE = getWsBase();
      const socket = new WebSocket(
        `${WS_BASE}/analyze-emotion/${projectId}?token=${encodeURIComponent(token)}`,
      );
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isCancelled) setConnected(true);
      };

      socket.onmessage = async (event) => {
        if (isCancelled) return;
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (msg.type) {
          case "connected":
            break;

          case "step_started":
          case "step_completed":
          case "progress_update":
          case "pipeline_completed":
            if (Array.isArray(msg.all_steps)) setSteps(msg.all_steps);
            if (typeof msg.overall_progress === "number") {
              setProgress(msg.overall_progress);
            }
            break;

          case "analysis_complete":
            setProgress(100);
            setRunning(false);
            onCompletedRef.current?.(msg.result);
            socket.close();
            break;

          case "error":
          case "pipeline_failed": {
            const errMsg = msg.error ?? "Analysis failed";
            const isAuthError =
              errMsg.toLowerCase().includes("token") ||
              errMsg.toLowerCase().includes("unauthorized");

            if (isAuthError) {
              const newToken = await refreshAccessToken();
              if (newToken && !isCancelled) {
                dispatch(setUpdateTokens({ accessToken: newToken }));
                socket.close();
                connect(newToken);
                return;
              }
              // Refresh failed — clear session
              dispatch(clearCredentials());
            }

            setError(errMsg);
            setRunning(false);
            socket.close();
            break;
          }

          default:
            break;
        }
      };

      socket.onerror = () => {
        if (!isCancelled) {
          setError("WebSocket connection failed");
          setRunning(false);
        }
      };

      socket.onclose = () => {
        if (!isCancelled) setConnected(false);
      };
    };

    const token = reduxToken ?? "";
    connect(token);

    return () => {
      isCancelled = true;
      wsRef.current?.close();
      setRunning(false);
      setConnected(false);
    };
  }, [enabled, projectId, reduxToken, dispatch]);

  return {
    connected,
    running,
    progress,
    steps,
    error,
  };
}