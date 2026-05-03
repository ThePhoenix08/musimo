// ============================================================
// FILE: src/hooks/useEmotionAnalysisSocket.js
// WEBSOCKET HOOK WITH AUTO REFRESH TOKEN SUPPORT
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE = "/api";
const WS_BASE = "ws://localhost:8000/api/ws";

/**
 * Try refreshing auth using cookie-based refresh token.
 * Expects backend to return new access token in Authorization header
 * OR JSON body.accessToken
 */
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

    const authHeader = res.headers.get("authorization");
    const body = await res.json().catch(() => null);

    const tokenFromHeader = authHeader?.replace("Bearer ", "");
    const tokenFromBody = body?.accessToken;

    const newToken = tokenFromHeader || tokenFromBody;

    if (newToken) {
      localStorage.setItem("access_token", newToken);
      return newToken;
    }

    return null;
  } catch (err) {
    console.error("Refresh token failed:", err);
    return null;
  }
}

/**
 * Get token or refresh if missing
 */
async function getValidAccessToken() {
  let token = localStorage.getItem("access_token");

  if (token) return token;

  token = await refreshAccessToken();

  return token || "";
}

export function useEmotionAnalysisSocket({
  projectId,
  enabled,
  onCompleted,
}) {
  const wsRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !projectId) return;

    let socket = null;
    let closedByCleanup = false;

    const connect = async () => {
      setError("");
      setRunning(true);

      const token = await getValidAccessToken();

      socket = new WebSocket(
        `${WS_BASE}/analyze-emotion/${projectId}?token=${token}`,
      );

      wsRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "connected":
            break;

          case "step_started":
          case "step_completed":
          case "progress_update":
          case "pipeline_completed":
            if (msg.all_steps) setSteps(msg.all_steps);

            if (
              typeof msg.overall_progress === "number"
            ) {
              setProgress(msg.overall_progress);
            }
            break;

          case "analysis_complete":
            setProgress(100);
            setRunning(false);
            onCompleted?.(msg.result);
            socket.close();
            break;

          case "error":
          case "pipeline_failed":
            /**
             * If backend says unauthorized / token expired
             * try refresh once and reconnect
             */
            if (
              msg.error?.toLowerCase?.().includes("token") ||
              msg.error?.toLowerCase?.().includes("unauthorized")
            ) {
              const newToken =
                await refreshAccessToken();

              if (newToken && !closedByCleanup) {
                socket.close();

                socket = new WebSocket(
                  `${WS_BASE}/analyze-emotion/${projectId}?token=${newToken}`,
                );

                wsRef.current = socket;
                return;
              }
            }

            setError(
              msg.error || "Analysis failed",
            );
            setRunning(false);
            socket.close();
            break;
        }
      };

      socket.onerror = () => {
        setError("WebSocket connection failed");
        setRunning(false);
      };

      socket.onclose = () => {
        setConnected(false);

        if (!closedByCleanup) {
          setRunning(false);
        }
      };
    };

    connect();

    return () => {
      closedByCleanup = true;
      wsRef.current?.close();
    };
  }, [enabled, projectId, onCompleted]);

  return {
    connected,
    running,
    progress,
    steps,
    error,
  };
}