import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address."),
  password: z.string().trim().min(1, "Password is required."),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required.")
    .regex(/^[a-zA-Z ]+$/, "Full name can only contain letters and spaces."),
  username: z
    .string()
    .trim()
    .min(1, "Username is required.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores.",
    ),
  email: z.string().trim().email("Invalid email address."),
  password: z
    .string()
    .trim()
    .min(8, "Password must be atleat 8 characters long.")
    .max(32, "Password must not exceed 32 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character.",
    ),
});

export const requestOtpSchema = z.object({
  email: z.string().trim().email("Invalid email address."),

  purpose: z.enum(["email_verification", "password_reset", "two_factor_auth"], {
    errorMap: () => ({
      message:
        "Purpose must be 'email_verification', 'password_reset', or 'two_factor_auth'",
    }),
  }),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email("Invalid email address"),

  purpose: z.enum(["email_verification", "password_reset", "two_factor_auth"], {
    errorMap: () => ({
      message:
        "Purpose must be 'email_verification', 'password_reset', or 'two_factor_auth'",
    }),
  }),

  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "OTP must be a 6-digit number"),
});
