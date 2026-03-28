import { pgTable, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lessonsTable = pgTable("lessons", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  level: text("level").notNull(),
  order: integer("order").notNull(),
  xpReward: integer("xp_reward").notNull().default(100),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  steps: jsonb("steps").$type<object[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({ createdAt: true });
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessonsTable.$inferSelect;
