import { useState } from "react";
import { toast } from "react-toastify";
import { useDeleteProjectByIdMutation } from "../actions/project.api";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music2,
  Trash2,
  Play,
  ExternalLink,
  Clock,
  MoreVertical,
  Mic2,
  Radio,
} from "lucide-react";

/* ─── tiny static waveform bars (pure CSS, no audio needed) ─── */
const WaveformDecor = ({ active }) => {
  const bars = [3, 6, 4, 8, 5, 9, 4, 7, 3, 6, 8, 4, 6, 3, 7];
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 20 }}>
      {bars.map((h, i) => (
        <motion.div
          key={i}
          style={{
            width: 2,
            borderRadius: 999,
            background: active
              ? "var(--primary)"
              : "color-mix(in oklch, var(--primary) 35%, transparent)",
            height: active ? undefined : h * 1.5,
          }}
          animate={
            active
              ? { height: [h * 1.2, h * 2.2, h * 0.8, h * 1.8, h * 1.2] }
              : { height: h * 1.5 }
          }
          transition={
            active
              ? {
                  duration: 0.9 + i * 0.07,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.06,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
};

/* ─── genre tag pill ─── */
const GenreTag = ({ label }) => (
  <span
    style={{
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      padding: "2px 7px",
      borderRadius: 999,
      border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
      color: "color-mix(in oklch, var(--primary) 70%, var(--foreground))",
      background: "color-mix(in oklch, var(--primary) 8%, transparent)",
    }}
  >
    {label}
  </span>
);

/* ─── vinyl record SVG decoration ─── */
const VinylDecor = ({ spinning }) => (
  <motion.div
    animate={{ rotate: spinning ? 360 : 0 }}
    transition={
      spinning
        ? { duration: 3, repeat: Infinity, ease: "linear" }
        : { duration: 0.6, ease: "easeOut" }
    }
    style={{ width: 52, height: 52, flexShrink: 0 }}
  >
    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* outer disc */}
      <circle
        cx="26"
        cy="26"
        r="25"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="1"
      />
      {/* grooves */}
      {[20, 17, 14, 11].map((r) => (
        <circle
          key={r}
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke="color-mix(in oklch, var(--border) 60%, transparent)"
          strokeWidth="0.6"
        />
      ))}
      {/* label ring */}
      <circle cx="26" cy="26" r="9" fill="var(--accent)" />
      {/* amber center dot */}
      <circle cx="26" cy="26" r="4" fill="var(--primary)" opacity="0.9" />
      {/* spindle hole */}
      <circle cx="26" cy="26" r="1.5" fill="var(--background)" />
      {/* highlight arc */}
      <path
        d="M 10 26 A 16 16 0 0 1 26 10"
        stroke="white"
        strokeWidth="0.8"
        strokeOpacity="0.08"
        strokeLinecap="round"
      />
    </svg>
  </motion.div>
);

/* ─── main card ─── */
const ProjectCard = ({ project }) => {
  const [deleteProject, { isLoading }] = useDeleteProjectByIdMutation();
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    setMenuOpen(false);
    try {
      await deleteProject({ projectId: project.id }).unwrap();
      toast.success("Project deleted");
    } catch (error) {
      toast.error("Failed to delete project");
      console.error(error);
    }
  };

  /* derive some display data from project */
  const genre = project.genre ?? "Track";
  const duration = project.duration ?? "—";
  const createdAt = project.created_at
    ? new Date(project.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => {
        setHovered(false);
        setMenuOpen(false);
      }}
      style={{ position: "relative" }}
    >
      {/* card shell */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
          transition: "border-color 0.25s ease, box-shadow 0.25s ease",
          borderColor: hovered
            ? "color-mix(in oklch, var(--primary) 40%, var(--border))"
            : "var(--border)",
          boxShadow: hovered
            ? "0 8px 32px color-mix(in oklch, var(--primary) 12%, transparent), 0 2px 8px rgba(0,0,0,0.4)"
            : "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        {/* amber top accent line */}
        <motion.div
          style={{
            height: 2,
            background:
              "linear-gradient(90deg, var(--primary), color-mix(in oklch, var(--primary) 40%, transparent))",
            transformOrigin: "left",
          }}
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        {/* top row: vinyl + meta + menu */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            {/* vinyl */}
            <VinylDecor spinning={playing} />

            {/* title + description */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 3,
                }}
              >
                <Mic2
                  size={10}
                  style={{ color: "var(--primary)", flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--primary)",
                  }}
                >
                  {genre}
                </span>
              </div>

              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--foreground)",
                  letterSpacing: "0.01em",
                  lineHeight: 1.25,
                  marginBottom: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {project.name}
              </h3>

              {project.description && (
                <p
                  style={{
                    fontSize: 11.5,
                    color: "var(--muted-foreground)",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {project.description}
                </p>
              )}
            </div>

            {/* kebab menu */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  background: menuOpen ? "var(--accent)" : "transparent",
                  color: "var(--muted-foreground)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                <MoreVertical size={14} />
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: "absolute",
                      top: 34,
                      right: 0,
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "4px",
                      zIndex: 50,
                      minWidth: 130,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    }}
                  >
                    <button
                      onClick={handleDelete}
                      disabled={isLoading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: 7,
                        border: "none",
                        background: "transparent",
                        color: "var(--destructive)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.5 : 1,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "color-mix(in oklch, var(--destructive) 12%, transparent)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Trash2 size={13} />
                      {isLoading ? "Deleting…" : "Delete project"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* divider */}
        <div
          style={{
            margin: "14px 16px 0",
            height: 1,
            background: "var(--border)",
            opacity: 0.6,
          }}
        />

        {/* bottom bar: waveform + duration + actions */}
        <div
          style={{
            padding: "10px 16px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* waveform */}
          <WaveformDecor active={playing} />

          {/* duration */}
          {duration !== "—" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "var(--muted-foreground)",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              <Clock size={10} />
              {duration}
            </div>
          )}

          {createdAt && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "var(--muted-foreground)",
                fontSize: 10,
                marginLeft: "auto",
              }}
            >
              <Radio size={10} />
              {createdAt}
            </div>
          )}

          {/* play toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setPlaying((v) => !v)}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "none",
              background: playing
                ? "var(--primary)"
                : "color-mix(in oklch, var(--primary) 15%, transparent)",
              color: playing ? "var(--primary-foreground)" : "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: playing
                ? "0 0 14px color-mix(in oklch, var(--primary) 45%, transparent)"
                : "none",
              transition: "background 0.25s, box-shadow 0.25s, color 0.25s",
              marginLeft: createdAt ? 0 : "auto",
            }}
          >
            {playing ? (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="currentColor"
              >
                <rect x="1" y="1" width="3" height="8" rx="1" />
                <rect x="6" y="1" width="3" height="8" rx="1" />
              </svg>
            ) : (
              <Play size={11} style={{ marginLeft: 1 }} />
            )}
          </motion.button>

          {/* open link */}
          <Link to={`/app/projects/${project.id}`}>
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--muted-foreground)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onHoverStart={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.color = "var(--primary)";
              }}
              onHoverEnd={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              <ExternalLink size={11} />
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
