import React from "react";
import { InstrumentIcon } from "./InstrumentsIcons";

function capitalize(str) {
  return str?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const ROLE_COLORS = {
  lead: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  harmony: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  rhythm: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  texture: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  bass: "text-green-400 border-green-400/30 bg-green-400/10",
  accent: "text-pink-400 border-pink-400/30 bg-pink-400/10",
};

const COMPLEXITY_COLORS = {
  sparse: "text-blue-300",
  moderate: "text-green-300",
  layered: "text-yellow-300",
  dense: "text-orange-300",
};

export default function AiSummarySection({ summary }) {
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h3 className="text-3xl font-bold mb-2">
          {summary.overall_summary?.title}
        </h3>
        <p className="text-zinc-300 text-lg leading-relaxed mb-6">
          {summary.overall_summary?.summary}
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm uppercase text-zinc-400 mb-1">
              Ensemble Character
            </p>
            <p className="text-base font-semibold">
              {summary.overall_summary?.ensemble_character}
            </p>
          </div>
          <div>
            <p className="text-sm uppercase text-zinc-400 mb-1">
              Genre Context
            </p>
            <p className="text-base font-semibold">
              {summary.overall_summary?.genre_context}
            </p>
          </div>
        </div>
      </div>

      {summary.instrument_roles?.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h3 className="text-2xl font-semibold mb-6">Instrument Roles</h3>
          <div className="space-y-4">
            {summary.instrument_roles.map((item) => (
              <div
                key={item.instrument}
                className="flex items-start gap-4 pb-4 border-b border-white/10 last:border-b-0"
              >
                <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10">
                  <InstrumentIcon name={item.instrument} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold">
                      {capitalize(item.instrument)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        ROLE_COLORS[item.role] ??
                        "text-zinc-400 border-white/20 bg-white/5"
                      }`}
                    >
                      {item.role}
                    </span>
                    <span className="text-xs text-zinc-500 ml-auto font-mono">
                      {(item.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{item.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.sonic_palette && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h3 className="text-2xl font-semibold mb-6">Sonic Palette</h3>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm uppercase text-zinc-400 mb-2">
                Primary Texture
              </p>
              <p className="text-2xl font-bold">
                {summary.sonic_palette.primary_texture}
              </p>
            </div>
            <div>
              <p className="text-sm uppercase text-zinc-400 mb-2">
                Energy Profile
              </p>
              <p className="text-2xl font-bold capitalize">
                {summary.sonic_palette.energy_profile}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm uppercase text-zinc-400 mb-2">
              Arrangement Complexity
            </p>
            <p
              className={`text-lg font-semibold capitalize ${
                COMPLEXITY_COLORS[
                  summary.sonic_palette.arrangement_complexity
                ] ?? ""
              }`}
            >
              {summary.sonic_palette.arrangement_complexity}
            </p>
          </div>

          {summary.sonic_palette.secondary_textures?.length > 0 && (
            <div>
              <p className="text-sm uppercase text-zinc-400 mb-2">
                Secondary Textures
              </p>
              <div className="flex flex-wrap gap-2">
                {summary.sonic_palette.secondary_textures.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {summary.instrument_tags?.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h3 className="text-2xl font-semibold mb-4">Instrument Tags</h3>
          <div className="flex flex-wrap gap-2">
            {summary.instrument_tags.map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 rounded-full bg-linear-to-r from-yellow-400/20 to-pink-500/20 border border-yellow-400/30 text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {summary.arrangement_notes?.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h3 className="text-2xl font-semibold mb-6">Arrangement Notes</h3>
          <div className="space-y-4">
            {summary.arrangement_notes.map((note, idx) => (
              <div
                key={idx}
                className="flex gap-4 pb-4 border-b border-white/10 last:border-b-0"
              >
                <div className="shrink-0 w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-400">
                    {idx + 1}
                  </span>
                </div>
                <div>
                  <p className="font-semibold mb-1">{note.title}</p>
                  <p className="text-sm text-zinc-400">{note.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.mix_feedback && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h3 className="text-2xl font-semibold mb-6">Mix Analysis</h3>
          <div className="space-y-4">
            {[
              {
                label: "Tonal Balance",
                value: summary.mix_feedback.tonal_balance,
              },
              {
                label: "Arrangement Suggestion",
                value: summary.mix_feedback.arrangement_suggestion,
              },
              {
                label: "Sonic Strength",
                value: summary.mix_feedback.sonic_strength,
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-semibold mb-1">{label}</p>
                <p className="text-zinc-300">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.listener_impression && (
        <div className="rounded-3xl border border-white/10 bg-linear-to-r from-yellow-400/10 to-pink-500/10 p-8">
          <p className="text-sm uppercase text-zinc-400 mb-2">
            Listener Impression
          </p>
          <p className="text-lg leading-relaxed">
            {summary.listener_impression}
          </p>
        </div>
      )}
    </div>
  );
}
