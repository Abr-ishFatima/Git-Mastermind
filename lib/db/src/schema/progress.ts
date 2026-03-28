import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProgressTable = pgTable("user_progress", {
  sessionId: text("session_id").primaryKey(),
  completedLessons: jsonb("completed_lessons").$type<string[]>().notNull().default([]),
  totalXp: integer("total_xp").notNull().default(0),
  currentLevel: text("current_level").notNull().default("beginner"),
  streak: integer("streak").notNull().default(0),
  sessionCount: integer("session_count").notNull().default(1),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  aiCorrections: integer("ai_corrections").notNull().default(0),
  sessionCorrections: jsonb("session_corrections").$type<object[]>().notNull().default([]),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userProgressTable).omit({ createdAt: true, lastActiveAt: true });
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgressTable.$inferSelect;
