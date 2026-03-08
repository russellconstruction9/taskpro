import { z } from "zod";

// ─── AUTH ────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const pinLoginSchema = z.object({
  businessId: z.coerce.number().int().positive("Invalid business ID"),
  pin: z
    .string()
    .length(6, "PIN must be exactly 6 digits")
    .regex(/^\d{6}$/, "PIN must contain only digits"),
});

// Helper: treat empty strings as null for optional fields
const emptyToNull = z.literal("").transform(() => null);

// ─── PROFILES ────────────────────────────────────────────────
export const createProfileSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(200),
  role: z.enum(["admin", "worker"]),
  email: z.union([z.string().email(), emptyToNull]).optional().nullable(),
  password: z.union([z.string().min(6), emptyToNull]).optional().nullable(),
  pin: z.union([z.string().length(6).regex(/^\d{6}$/), emptyToNull]).optional().nullable(),
  hourlyRate: z.coerce.number().min(0).default(0),
});

// ─── JOBS ────────────────────────────────────────────────────
export const createJobSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export const updateJobSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
});

// ─── TASKS ───────────────────────────────────────────────────
export const createTaskSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional().nullable(),
  assignedTo: z.coerce.number().int().positive().optional().nullable(),
  requiresPhoto: z.boolean().default(false),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  assignedTo: z.coerce.number().int().positive().optional().nullable(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  requiresPhoto: z.boolean().optional(),
});

// ─── TIME ENTRIES ────────────────────────────────────────────
export const clockInSchema = z.object({
  taskId: z.coerce.number().int().positive().optional().nullable(),
});

export const clockOutSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ─── PHOTO ───────────────────────────────────────────────────
export const uploadPhotoSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  caption: z.string().max(500).optional().nullable(),
});
