import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userProgressTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const XP_THRESHOLDS = {
  beginner: 0,
  intermediate: 500,
  advanced: 1200,
};

const LESSON_XP: Record<string, number> = {
  beginner: 50,
  intermediate: 100,
  advanced: 150,
};

function calculateLevel(xp: number): string {
  if (xp >= XP_THRESHOLDS.advanced) return "advanced";
  if (xp >= XP_THRESHOLDS.intermediate) return "intermediate";
  return "beginner";
}

function toDateOnly(date: Date): string {
  return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function calculateStreak(lastActiveAt: Date | null, currentStreak: number): number {
  if (!lastActiveAt) return 1;

  const todayStr = toDateOnly(new Date());
  const lastStr = toDateOnly(new Date(lastActiveAt));

  if (lastStr === todayStr) {
    // Already active today — preserve streak
    return Math.max(1, currentStreak);
  }

  const todayMs = new Date(todayStr).getTime();
  const lastMs = new Date(lastStr).getTime();
  const diffDays = Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day — increment
    return currentStreak + 1;
  }

  // Gap of 2+ days — reset
  return 1;
}

router.get("/progress", async (req, res) => {
  try {
    const { sessionId } = req.query as { sessionId: string };
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    let [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));

    if (!progress) {
      await db.insert(userProgressTable).values({
        sessionId,
        completedLessons: [],
        totalXp: 0,
        currentLevel: "beginner",
        streak: 0,
        sessionCount: 1,
        goals: ["Learn Git basics", "Make my first commit"],
        aiCorrections: 0,
        sessionCorrections: [],
      });
      [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
    }

    res.json({
      sessionId: progress.sessionId,
      completedLessons: progress.completedLessons,
      totalXp: progress.totalXp,
      currentLevel: progress.currentLevel,
      streak: progress.streak,
      sessionCount: progress.sessionCount,
      goals: progress.goals,
      aiCorrections: progress.aiCorrections,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

router.post("/progress/complete", async (req, res) => {
  try {
    const { sessionId, lessonId } = req.body;
    if (!sessionId || !lessonId) {
      return res.status(400).json({ error: "sessionId and lessonId are required" });
    }

    let [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));

    if (!progress) {
      await db.insert(userProgressTable).values({
        sessionId,
        completedLessons: [],
        totalXp: 0,
        currentLevel: "beginner",
        streak: 0,
        sessionCount: 1,
        goals: [],
        aiCorrections: 0,
        sessionCorrections: [],
      });
      [progress] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
    }

    const completedLessons = progress.completedLessons as string[];
    if (completedLessons.includes(lessonId)) {
      // Already completed — return current state unchanged
      return res.json({
        sessionId: progress.sessionId,
        completedLessons: progress.completedLessons,
        totalXp: progress.totalXp,
        currentLevel: progress.currentLevel,
        streak: progress.streak,
        sessionCount: progress.sessionCount,
        goals: progress.goals,
        aiCorrections: progress.aiCorrections,
      });
    }

    // Determine XP from lesson level
    const lessonLevel = lessonId.includes("advanced") ? "advanced"
      : lessonId.includes("intermediate") ? "intermediate"
      : "beginner";
    const xpGain = LESSON_XP[lessonLevel] || 100;
    const newXp = progress.totalXp + xpGain;
    const newCompleted = [...completedLessons, lessonId];
    const newLevel = calculateLevel(newXp);

    // Calculate streak properly based on days
    const newStreak = calculateStreak(progress.lastActiveAt, progress.streak);

    await db.update(userProgressTable)
      .set({
        completedLessons: newCompleted,
        totalXp: newXp,
        currentLevel: newLevel,
        streak: newStreak,
        lastActiveAt: new Date(),
      })
      .where(eq(userProgressTable.sessionId, sessionId));

    const [updated] = await db.select().from(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));

    res.json({
      sessionId: updated.sessionId,
      completedLessons: updated.completedLessons,
      totalXp: updated.totalXp,
      currentLevel: updated.currentLevel,
      streak: updated.streak,
      sessionCount: updated.sessionCount,
      goals: updated.goals,
      aiCorrections: updated.aiCorrections,
      xpGained: xpGain,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete lesson" });
  }
});

export default router;
