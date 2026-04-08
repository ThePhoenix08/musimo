import { z } from "zod";

const FILE_SIZE_LIMIT = 200 * 1024 * 1024;

const SUPPORTED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/ogg",
  "audio/aac",
];

export const AUDIO_FILE_SCHEMA = z
  .instanceof(File, { message: "Invalid file." })
  .refine((file) => SUPPORTED_AUDIO_MIME_TYPES.includes(file.type), {
    message: "Invalid audio file type.",
  })
  .refine((file) => file.size <= FILE_SIZE_LIMIT, {
    message: "Audio File should not exceed 200MB",
  })
  .refine((file) => file.size > 0, {
    message: "Audio File should not be empty",
  });

export const CREATE_PROJECT_SCHEMA = z.object({
  title: z
    .string()
    .min(5, "Project title must be at least 5 characters.")
    .max(32, "Project title must be at most 32 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(150, "Description must be at most 150 characters."),
});
