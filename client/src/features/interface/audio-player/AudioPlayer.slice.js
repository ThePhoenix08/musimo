import { createSlice, createSelector } from "@reduxjs/toolkit";

// ─── Geneva Emotion Scale (9 categorical labels) ──────────────────────────────
export const GES_LABELS = {
  joy: { label: "Joy", emoji: "😄", color: "#f59e0b" },
  sadness: { label: "Sadness", emoji: "😢", color: "#3b82f6" },
  fear: { label: "Fear", emoji: "😨", color: "#8b5cf6" },
  anger: { label: "Anger", emoji: "😠", color: "#ef4444" },
  tenderness: { label: "Tenderness", emoji: "🥰", color: "#ec4899" },
  wonder: { label: "Wonder", emoji: "🤩", color: "#06b6d4" },
  peacefulness: { label: "Peacefulness", emoji: "😌", color: "#10b981" },
  power: { label: "Power", emoji: "💪", color: "#f97316" },
  tension: { label: "Tension", emoji: "😬", color: "#6366f1" },
};

/**
 * Emotion segment shape:
 * {
 *   startTime: number,   // seconds
 *   endTime: number,     // seconds
 *   emotion: keyof GES_LABELS,
 *   confidence?: number  // 0-1
 * }
 */

const PLAYER_MODES = {
  HIDDEN: "hidden",
  MINI: "mini",     // h-16 collapsed strip
  NORMAL: "normal", // default — waveform + controls
  EXPANDED: "expanded", // fullscreen with zoom, analysis
};

const initialState = {
  // ── Audio source ────────────────────────────────────────────────────────────
  audioUrl: null,         // object URL or remote URL
  audioName: null,
  audioDuration: 0,

  // ── Playback ────────────────────────────────────────────────────────────────
  isPlaying: false,
  currentTime: 0,
  volume: 1,
  playbackRate: 1,
  isMuted: false,

  // ── Player mode (URL-synced) ─────────────────────────────────────────────
  playerMode: PLAYER_MODES.NORMAL, // "hidden" | "mini" | "normal" | "expanded"

  // ── Waveform ─────────────────────────────────────────────────────────────
  // Float32Array peaks, serialised as plain number[] for Redux serialisability
  waveformPeaks: [],      // normalised 0-1 amplitudes, length ≈ 800

  // ── Expanded-mode zoom window ────────────────────────────────────────────
  zoomStart: 0,           // fraction 0-1
  zoomEnd: 1,             // fraction 0-1

  // ── Geneva Emotion Labels ────────────────────────────────────────────────
  emotionSegments: [],    // EmotionSegment[]

  // ── External seek request (from active tab) ──────────────────────────────
  // A tab sets this object; the footer reads it and clears it.
  seekRequest: null,      // { time: number, source: string } | null

  // ── Loop region ─────────────────────────────────────────────────────────
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 0,

  // ── Analysis overlays (expanded mode) ───────────────────────────────────
  showSpectrum: false,
  showBeats: false,
  beatTimestamps: [],     // number[] seconds
};

const audioPlayerSlice = createSlice({
  name: "audioPlayer",
  initialState,
  reducers: {
    // ── Source ───────────────────────────────────────────────────────────────
    setAudioSource(state, { payload }) {
      // payload: { url, name, duration?, peaks? }
      state.audioUrl = payload.url;
      state.audioName = payload.name ?? null;
      state.audioDuration = payload.duration ?? 0;
      state.waveformPeaks = payload.peaks ?? [];
      state.currentTime = 0;
      state.isPlaying = false;
      state.zoomStart = 0;
      state.zoomEnd = 1;
    },
    clearAudioSource(state) {
      state.audioUrl = null;
      state.audioName = null;
      state.audioDuration = 0;
      state.waveformPeaks = [];
      state.currentTime = 0;
      state.isPlaying = false;
      state.emotionSegments = [];
      state.beatTimestamps = [];
    },

    // ── Waveform peaks (set after Web Audio decode) ──────────────────────────
    setWaveformPeaks(state, { payload }) {
      // payload: number[]
      state.waveformPeaks = payload;
    },

    // ── Playback ─────────────────────────────────────────────────────────────
    setPlaying(state, { payload }) {
      state.isPlaying = !!payload;
    },
    togglePlay(state) {
      state.isPlaying = !state.isPlaying;
    },
    setCurrentTime(state, { payload }) {
      state.currentTime = payload;
    },
    setDuration(state, { payload }) {
      state.audioDuration = payload;
    },
    setVolume(state, { payload }) {
      state.volume = Math.min(1, Math.max(0, payload));
      state.isMuted = false;
    },
    toggleMute(state) {
      state.isMuted = !state.isMuted;
    },
    setPlaybackRate(state, { payload }) {
      state.playbackRate = payload;
    },

    // ── Player mode ───────────────────────────────────────────────────────────
    setPlayerMode(state, { payload }) {
      if (Object.values(PLAYER_MODES).includes(payload)) {
        state.playerMode = payload;
      }
    },

    // ── Zoom window ───────────────────────────────────────────────────────────
    setZoomWindow(state, { payload }) {
      // payload: { start: 0-1, end: 0-1 }
      const minWidth = 0.02;
      let { start, end } = payload;
      start = Math.max(0, Math.min(start, 1 - minWidth));
      end = Math.min(1, Math.max(end, start + minWidth));
      state.zoomStart = start;
      state.zoomEnd = end;
    },
    resetZoom(state) {
      state.zoomStart = 0;
      state.zoomEnd = 1;
    },

    // ── Emotion labels ────────────────────────────────────────────────────────
    setEmotionSegments(state, { payload }) {
      // payload: EmotionSegment[]
      state.emotionSegments = payload;
    },
    addEmotionSegment(state, { payload }) {
      state.emotionSegments.push(payload);
    },
    clearEmotionSegments(state) {
      state.emotionSegments = [];
    },

    // ── External seek (tab → footer) ─────────────────────────────────────────
    /**
     * Any active tab can dispatch seekToTime({ time, source }) to move the
     * global player cursor.  The footer component watches seekRequest and
     * clears it after honouring it.
     */
    seekToTime(state, { payload }) {
      // payload: { time: number, source?: string }
      state.seekRequest = { time: payload.time, source: payload.source ?? "external" };
    },
    clearSeekRequest(state) {
      state.seekRequest = null;
    },

    // ── Loop ─────────────────────────────────────────────────────────────────
    setLoopRegion(state, { payload }) {
      // payload: { start, end }
      state.loopStart = payload.start;
      state.loopEnd = payload.end;
    },
    toggleLoop(state) {
      state.loopEnabled = !state.loopEnabled;
    },
    disableLoop(state) {
      state.loopEnabled = false;
    },

    // ── Analysis overlays ────────────────────────────────────────────────────
    toggleSpectrum(state) {
      state.showSpectrum = !state.showSpectrum;
    },
    toggleBeats(state) {
      state.showBeats = !state.showBeats;
    },
    setBeatTimestamps(state, { payload }) {
      state.beatTimestamps = payload;
    },
  },
});

export const {
  setAudioSource,
  clearAudioSource,
  setWaveformPeaks,
  setPlaying,
  togglePlay,
  setCurrentTime,
  setDuration,
  setVolume,
  toggleMute,
  setPlaybackRate,
  setPlayerMode,
  setZoomWindow,
  resetZoom,
  setEmotionSegments,
  addEmotionSegment,
  clearEmotionSegments,
  seekToTime,
  clearSeekRequest,
  setLoopRegion,
  toggleLoop,
  disableLoop,
  toggleSpectrum,
  toggleBeats,
  setBeatTimestamps,
} = audioPlayerSlice.actions;

export { PLAYER_MODES };

export default audioPlayerSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectAudioUrl = (s) => s.audioPlayer.audioUrl;
export const selectAudioName = (s) => s.audioPlayer.audioName;
export const selectIsPlaying = (s) => s.audioPlayer.isPlaying;
export const selectCurrentTime = (s) => s.audioPlayer.currentTime;
export const selectDuration = (s) => s.audioPlayer.audioDuration;
export const selectVolume = (s) => s.audioPlayer.volume;
export const selectIsMuted = (s) => s.audioPlayer.isMuted;
export const selectPlaybackRate = (s) => s.audioPlayer.playbackRate;
export const selectPlayerMode = (s) => s.audioPlayer.playerMode;
export const selectWaveformPeaks = (s) => s.audioPlayer.waveformPeaks;
export const selectEmotionSegments = (s) => s.audioPlayer.emotionSegments;
export const selectSeekRequest = (s) => s.audioPlayer.seekRequest;
export const selectLoopEnabled = (s) => s.audioPlayer.loopEnabled;
export const selectBeatTimestamps = (s) => s.audioPlayer.beatTimestamps;
export const selectShowSpectrum = (s) => s.audioPlayer.showSpectrum;
export const selectShowBeats = (s) => s.audioPlayer.showBeats;

// export const selectLoopRegion = (s) => ({ start: s.audioPlayer.loopStart, end: s.audioPlayer.loopEnd });
// export const selectZoomWindow = (s) => ({ start: s.audioPlayer.zoomStart, end: s.audioPlayer.zoomEnd });

export const selectZoomWindow = createSelector(
  (s) => s.audioPlayer.zoomStart,
  (s) => s.audioPlayer.zoomEnd,
  (start, end) => ({ start, end })
);

export const selectLoopRegion = createSelector(
  (s) => s.audioPlayer.loopStart,
  (s) => s.audioPlayer.loopEnd,
  (start, end) => ({ start, end })
);

/**
 * Returns the active emotion label (string key) at the current playback time.
 * Returns null if no segment covers the current time.
 */
export const selectCurrentEmotion = (s) => {
  const { currentTime, emotionSegments } = s.audioPlayer;
  const seg = emotionSegments.find(
    (e) => currentTime >= e.startTime && currentTime < e.endTime,
  );
  return seg?.emotion ?? null;
};

// ─── Integration Guide ────────────────────────────────────────────────────────
/**
 * HOW TO SYNC AN ACTIVE TAB WITH THE GLOBAL PLAYER
 * -------------------------------------------------
 *
 * 1. Load a project's audio into the global player from any tab/thunk:
 *
 *    dispatch(setAudioSource({
 *      url: project.audioUrl,
 *      name: project.title,
 *      duration: project.duration,
 *    }));
 *
 * 2. After the waveform is decoded, save peaks:
 *
 *    dispatch(setWaveformPeaks(Array.from(decodedPeaks)));
 *
 * 3. Load emotion labels from your model output:
 *
 *    dispatch(setEmotionSegments([
 *      { startTime: 0,  endTime: 5,  emotion: "joy" },
 *      { startTime: 5,  endTime: 10, emotion: "sadness" },
 *      ...
 *    ]));
 *
 * 4. From any active tab, seek the global player to a timestamp
 *    (e.g. user clicks a point on an emotion chart):
 *
 *    dispatch(seekToTime({ time: 42.5, source: "emotionTab" }));
 *
 *    The footer honours this and calls clearSeekRequest() immediately.
 *
 * 5. Change player mode programmatically:
 *
 *    dispatch(setPlayerMode("expanded")); // "mini" | "normal" | "expanded" | "hidden"
 *
 * 6. Add beat markers:
 *
 *    dispatch(setBeatTimestamps([1.2, 2.4, 3.6, ...]));
 */