"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setUpdateTokens,
  selectAccessToken,
} from "@/features/auth/state/slices/auth.slice";

const API_BASE = "/api";

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

/**
 * Hook for managing project audio: fetch primary, stream stems, playback, delete.
 *
 * @param {string} projectId  - UUID of the project
 * @param {boolean} autoFetch - Fetch primary audio on mount (default: false)
 */
export function useAudioSeparation(projectId, autoFetch = false) {
  const dispatch = useDispatch();
  const token = useSelector(selectAccessToken);

  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  // ─── helpers ────────────────────────────────────────────────────────────────

  const getAuthHeaders = useCallback(
    (tok) => ({ Authorization: `Bearer ${tok}` }),
    [],
  );

  const withToken = useCallback(
    async (fn) => {
      let tok = token;
      if (!tok) tok = await refreshAccessToken(dispatch);
      if (!tok) throw new Error("Unauthorized");

      try {
        return await fn(tok);
      } catch (err) {
        if (err?.status === 401) {
          tok = await refreshAccessToken(dispatch);
          if (!tok) throw new Error("Unauthorized");
          return await fn(tok);
        }
        throw err;
      }
    },
    [token, dispatch],
  );

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // ─── attach audio element events ────────────────────────────────────────────

  // FIX 1: extracted so playStream can also call it
  const attachAudioEvents = useCallback((audio) => {
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    audio.ondurationchange = () => setDuration(audio.duration);
    audio.onplay = () => setPlaying(true);
    audio.onpause = () => setPlaying(false);
    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
    };
    audio.onerror = () => setError("Audio playback error");
  }, []);

  // ─── fetch primary audio metadata ───────────────────────────────────────────

  const fetchPrimaryAudio = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");

    try {
      await withToken(async (tok) => {
        const res = await fetch(
          `/api/projects/${projectId}/audio-files/primary`,
          { headers: getAuthHeaders(tok), credentials: "include" },
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw Object.assign(
            new Error(body?.detail || "Failed to fetch audio"),
            { status: res.status },
          );
        }

        const data = await res.json();
        setAudioFile(data.data);
      });
    } catch (err) {
      setError(err.message || "Failed to fetch audio");
    } finally {
      setLoading(false);
    }
  }, [projectId, withToken, getAuthHeaders]);

  // ─── trigger separation + SSE stream ────────────────────────────────────────
  // Single entry point: POSTs with auth, then opens an authenticated fetch-based
  // SSE stream (EventSource can't send headers). Returns a cancel function.

  const triggerSeparation = useCallback(
    async (audioId, onStem, onError, streamOnly = false) => {
      // Resolve a fresh token once for both the POST and the stream.
      let tok = token;
      if (!tok) tok = await refreshAccessToken(dispatch);
      if (!tok) {
        onError?.("Unauthorized");
        return () => {};
      }

      // Skip POST if we just want to check current status (e.g. on mount).
      // Always fall through to SSE stream — it returns correct file_url values
      // built by the backend, avoiding any bucket name mismatch on the client.
      if (!streamOnly) {
        try {
          const res = await fetch(`${API_BASE}/audio/process/${audioId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${tok}` },
            credentials: "include",
          });

          const json = await res.json().catch(() => ({}));

          if (!res.ok) {
            const isTerminal = res.status < 500 && res.status !== 409;
            if (isTerminal) {
              onError?.(json?.detail || "Failed to start separation");
              return () => {};
            }
            // 500 / 409 → job already running, open stream below
          }
          // Whether "done" or still processing, always open the SSE stream
          // so we get URLs from the backend rather than constructing them here.
        } catch {
          onError?.("Failed to start separation");
          return () => {};
        }
      }

      // Open the SSE stream with the auth header via fetch + ReadableStream.
      let cancelled = false;

      const run = async () => {
        // Re-resolve token in case the POST refresh is fresher.
        let streamTok = token;
        if (!streamTok) streamTok = await refreshAccessToken(dispatch);
        if (!streamTok) {
          onError?.("Unauthorized");
          return;
        }

        let res;
        try {
          res = await fetch(`${API_BASE}/projects/${projectId}/stems/stream`, {
            headers: { Authorization: `Bearer ${streamTok}` },
            credentials: "include",
          });
        } catch {
          if (!cancelled) onError?.("Stream connection failed");
          return;
        }

        if (!res.ok || !res.body) {
          if (!cancelled) onError?.("Stream connection failed");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            try {
              const data = JSON.parse(line.slice(5).trim());

              if (data.status === "completed") {
                const ORDER = ["vocals", "drums", "bass", "other"];
                const sorted = ORDER.map((key) =>
                  data.stems.find((s) => s.source_type === key),
                ).filter(Boolean);
                if (!cancelled) onStem?.(sorted);
                return;
              } else if (data.status === "failed") {
                if (!cancelled) onError?.("Stem separation failed");
                return;
              }
            } catch {
              // malformed frame — skip
            }
          }
        }
      };

      run().catch(() => {
        if (!cancelled) onError?.("Stream error");
      });

      return () => { cancelled = true; };
    },
    [projectId, token, dispatch],
  );

  // ─── playback controls ───────────────────────────────────────────────────────

  // FIX 3: playStream now attaches audio events so state stays in sync
  const playStream = useCallback(
    async (url) => {
      if (!url) return;

      if (audioRef.current) {
        audioRef.current.pause();
      }

      revokeObjectUrl();

      const audio = new Audio(url);
      audioRef.current = audio;
      attachAudioEvents(audio);

      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setError("Playback failed");
      }
    },
    [attachAudioEvents, revokeObjectUrl],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => setError("Playback failed"));
  }, []);

  const seek = useCallback((percent) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    audioRef.current.currentTime = (percent / 100) * audioRef.current.duration;
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setProgress(0);
    setPlaying(false);
  }, []);

  // ─── delete audio ────────────────────────────────────────────────────────────

  const deleteAudio = useCallback(
    async (audioId) => {
      if (!audioId) return;
      setLoading(true);
      setError("");

      try {
        await withToken(async (tok) => {
          const res = await fetch(
            `${API_BASE}/projects/${projectId}/audio/${audioId}`,
            {
              method: "DELETE",
              headers: getAuthHeaders(tok),
              credentials: "include",
            },
          );

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.detail || "Failed to delete audio");
          }

          if (audioFile?.id === audioId) {
            stop();
            revokeObjectUrl();
            setAudioFile(null);
          }
        });
      } catch (err) {
        setError(err.message || "Delete failed");
      } finally {
        setLoading(false);
      }
    },
    [projectId, audioFile, withToken, getAuthHeaders, stop, revokeObjectUrl],
  );

  // ─── auto-fetch on mount ─────────────────────────────────────────────────────

  useEffect(() => {
    if (autoFetch && projectId) {
      fetchPrimaryAudio();
    }
  }, [autoFetch, projectId, fetchPrimaryAudio]);

  // ─── cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      revokeObjectUrl();
    };
  }, [revokeObjectUrl]);

  return {
    audioFile,
    loading,
    playing,
    progress,
    duration,
    error,
    fetchPrimaryAudio,
    triggerSeparation,
    playStream,
    pause,
    resume,
    seek,
    stop,
    deleteAudio,
  };
}