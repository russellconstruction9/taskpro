import {
  pgTable,
  bigint,
  text,
  boolean,
  numeric,
  timestamp,
  uniqueIndex,
  index,
  customType,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// Custom bytea type for photo storage
const bytea = customType<{ data: Buffer; dpiverType: string }>({
  dataType() {
    return "bytea";
  },
});

// ─── BUSINESSES ──────────────────────────────────────────────
export const businesses = pgTable("businesses", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const businessesRelations = relations(businesses, ({ many }) => ({
  profiles: many(profiles),
  jobs: many(jobs),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
  taskPhotos: many(taskPhotos),
}));

// ─── PROFILES ────────────────────────────────────────────────
export const profiles = pgTable(
  "profiles",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    businessId: bigint("business_id", { mode: "number" })
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("worker"), // 'admin' | 'worker'
    email: text("email"), // nullable — workers may not have email
    passwordHash: text("password_hash"), // bcrypt hash for admin email/pw login
    pinHash: text("pin_hash"), // bcrypt hash for worker PIN login
    fullName: text("full_name").notNull(),
    hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("profiles_business_id_idx").on(table.businessId),
    index("profiles_business_role_idx").on(table.businessId, table.role),
  ]
);

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  business: one(businesses, {
    fields: [profiles.businessId],
    references: [businesses.id],
  }),
  assignedTasks: many(tasks),
  timeEntries: many(timeEntries),
  uploadedPhotos: many(taskPhotos),
  pushSubscriptions: many(pushSubscriptions),
}));

// ─── JOBS ────────────────────────────────────────────────────
export const jobs = pgTable(
  "jobs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    businessId: bigint("business_id", { mode: "number" })
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    address: text("address"),
    status: text("status").notNull().default("active"), // 'active' | 'completed' | 'cancelled'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("jobs_business_id_idx").on(table.businessId),
    index("jobs_business_status_idx").on(table.businessId, table.status),
  ]
);

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  business: one(businesses, {
    fields: [jobs.businessId],
    references: [businesses.id],
  }),
  tasks: many(tasks),
}));

// ─── TASKS ───────────────────────────────────────────────────
export const tasks = pgTable(
  "tasks",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    businessId: bigint("business_id", { mode: "number" })
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    jobId: bigint("job_id", { mode: "number" })
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    assignedTo: bigint("assigned_to", { mode: "number" }).references(
      () => profiles.id,
      { onDelete: "set null" }
    ),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("pending"), // 'pending' | 'in_progress' | 'completed' | 'cancelled'
    requiresPhoto: boolean("requires_photo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("tasks_business_id_idx").on(table.businessId),
    index("tasks_job_id_idx").on(table.jobId),
    index("tasks_assigned_to_idx").on(table.assignedTo),
    index("tasks_business_status_idx").on(table.businessId, table.status),
  ]
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  business: one(businesses, {
    fields: [tasks.businessId],
    references: [businesses.id],
  }),
  job: one(jobs, {
    fields: [tasks.jobId],
    references: [jobs.id],
  }),
  assignee: one(profiles, {
    fields: [tasks.assignedTo],
    references: [profiles.id],
  }),
  photos: many(taskPhotos),
}));

// ─── TIME ENTRIES ────────────────────────────────────────────
export const timeEntries = pgTable(
  "time_entries",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    businessId: bigint("business_id", { mode: "number" })
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    profileId: bigint("profile_id", { mode: "number" })
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    taskId: bigint("task_id", { mode: "number" }).references(() => tasks.id, {
      onDelete: "set null",
    }),
    clockIn: timestamp("clock_in", { withTimezone: true })
      .notNull()
      .defaultNow(),
    clockOut: timestamp("clock_out", { withTimezone: true }), // NULL = currently clocked in
  },
  (table) => [
    index("time_entries_business_id_idx").on(table.businessId),
    index("time_entries_profile_id_idx").on(table.profileId),
    index("time_entries_task_id_idx").on(table.taskId),
    // Unique partial index: only one open clock-in per worker
    uniqueIndex("time_entries_one_active_per_worker").on(table.profileId).where(
      sql`${table.clockOut} IS NULL`
    ),
  ]
);

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  business: one(businesses, {
    fields: [timeEntries.businessId],
    references: [businesses.id],
  }),
  profile: one(profiles, {
    fields: [timeEntries.profileId],
    references: [profiles.id],
  }),
  task: one(tasks, {
    fields: [timeEntries.taskId],
    references: [tasks.id],
  }),
}));

// ─── TASK PHOTOS ─────────────────────────────────────────────
export const taskPhotos = pgTable(
  "task_photos",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    businessId: bigint("business_id", { mode: "number" })
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    taskId: bigint("task_id", { mode: "number" })
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    uploadedBy: bigint("uploaded_by", { mode: "number" })
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    photoData: bytea("photo_data").notNull(),
    mimeType: text("mime_type").notNull().default("image/jpeg"),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("task_photos_business_id_idx").on(table.businessId),
    index("task_photos_task_id_idx").on(table.taskId),
    index("task_photos_uploaded_by_idx").on(table.uploadedBy),
  ]
);

export const taskPhotosRelations = relations(taskPhotos, ({ one }) => ({
  business: one(businesses, {
    fields: [taskPhotos.businessId],
    references: [businesses.id],
  }),
  task: one(tasks, {
    fields: [taskPhotos.taskId],
    references: [tasks.id],
  }),
  uploader: one(profiles, {
    fields: [taskPhotos.uploadedBy],
    references: [profiles.id],
  }),
}));

// ─── PUSH SUBSCRIPTIONS ──────────────────────────────────────
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    profileId: bigint("profile_id", { mode: "number" })
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("push_subscriptions_profile_id_idx").on(table.profileId),
    uniqueIndex("push_subscriptions_endpoint_idx").on(table.endpoint),
  ]
);

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  profile: one(profiles, {
    fields: [pushSubscriptions.profileId],
    references: [profiles.id],
  }),
}));

// ─── TYPE EXPORTS ────────────────────────────────────────────
export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type TaskPhoto = typeof taskPhotos.$inferSelect;
export type NewTaskPhoto = typeof taskPhotos.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
